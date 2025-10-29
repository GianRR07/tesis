// backend-tesis/services/evaluador_llm.js
import fs from "fs";
import path from "path";
import { openDb } from "../db.js";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

// Carga pdf-parse como CJS siempre
const pdfParse = require("pdf-parse");
if (typeof pdfParse !== "function") {
  throw new Error(
    `pdf-parse no resolvió como función (typeof=${typeof pdfParse}). 
Asegúrate de instalarlo en backend-tesis.`
  );
}


const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "hermes3:8b";

// === util: lee PDF a texto
async function leerPDF(absPath) {
    const buf = fs.readFileSync(absPath);
    const data = await pdfParse(buf);
    return (data.text || "").replace(/\t/g, " ").trim();
}

// === llamada simple a Ollama (JSON mode)
// === llamada simple a Ollama (JSON mode) usando SIEMPRE hermes3:8b
async function ollamaJSON({ model = OLLAMA_MODEL, prompt, jsonSchemaHint }) {
  const body = {
    model, // ahora usa hermes3:8b (o lo que venga de OLLAMA_MODEL)
    prompt: `${prompt}

# FORMATO DE SALIDA
Devuelve SOLO un JSON válido y NADA MÁS. Sin explicaciones, sin texto adicional.
${jsonSchemaHint || ""}`,
    stream: false,
    format: "json"
  };

  let r;
  try {
    r = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (_e) {
    throw new Error("No se pudo conectar con Ollama en http://localhost:11434. ¿Está corriendo? (usa: ollama serve)");
  }

  let data;
  try {
    data = await r.json();
  } catch (_e) {
    throw new Error("Ollama respondió algo no-JSON. Revisa el servidor de Ollama.");
  }

  if (!r.ok) {
    throw new Error(data?.error || "Fallo en Ollama (respuesta HTTP no OK).");
  }

  try {
    return JSON.parse(data.response);
  } catch (_e) {
    throw new Error("El modelo no devolvió JSON válido. Ajusta el prompt o prueba con otra plantilla.");
  }
}

// --- Normaliza letras a A/B/C/D
function letraABCD(s) {
  if (!s) return null;
  const m = String(s).trim().match(/^[\(\s]*([a-dA-D])\b/);
  return m ? m[1].toUpperCase() : null;
}

// --- Divide el texto por preguntas: "1.", "2)", "3 -", etc.
function partirPorPreguntas(texto) {
  // Cortamos por inicios de pregunta preservando el número
  const re = /(^\s*(\d{1,3})\s*[\)\.\-:])/gmi;
  const out = [];
  let lastIndex = 0;
  let match;

  const indices = [];
  while ((match = re.exec(texto)) !== null) {
    indices.push({ idx: match.index, num: Number(match[2]) });
  }
  if (indices.length === 0) return out;

  for (let i = 0; i < indices.length; i++) {
    const start = indices[i].idx;
    const n = indices[i].num;
    const end = i + 1 < indices.length ? indices[i + 1].idx : texto.length;
    const chunk = texto.slice(start, end);
    out.push({ n, chunk });
  }
  return out;
}

// --- Regex extractor genérico: busca "Respuesta: X" dentro de cada bloque de pregunta
function extraerRespuestasPorRegex(texto) {
  const bloques = partirPorPreguntas(texto);
  const result = [];
  for (const b of bloques) {
    // Busca línea con "Respuesta:" dentro del bloque
    // Ejemplos válidos: "Respuesta: b) 1492", "Respuesta: B", "RESPUESTA: c ) ..."
    const m = b.chunk.match(/Respuesta\s*:\s*([a-dA-D])\b/mi);
    const ans = letraABCD(m?.[1] || null);
    if (ans) {
      result.push({ numero: b.n, respuesta: ans });
    }
  }
  // Si no pudimos partir por preguntas, intentamos plano (en orden)
  if (result.length === 0) {
    const ms = [...texto.matchAll(/Respuesta\s*:\s*([a-dA-D])\b/gi)];
    if (ms.length > 0) {
      return ms.map((m, i) => ({ numero: i + 1, respuesta: letraABCD(m[1]) }));
    }
  }
  return result; // [{numero, respuesta}]
}



// === extrae la CLAVE del examen (del PDF del docente)
// === extrae la CLAVE del examen (del PDF del docente)
async function extraerClaveDesdeTextoLLM(texto) {
  // 1) Intento determinista (regex)
  const rx = extraerRespuestasPorRegex(texto);
  if (rx.length > 0) {
    // Normalizamos a la estructura esperada por el calificador:
    return rx.map(r => ({
      numero: r.numero,
      enunciado: "",
      alternativas: [],
      respuesta_correcta: r.respuesta
    }));
  }

  // 2) Fallback LLM (few-shot + formato estricto)
  const prompt = `
Eres un extractor estricto de CLAVE DE RESPUESTAS desde un examen en texto.
Tu tarea: detectar cada pregunta en ORDEN y devolver SOLO JSON con arreglo "preguntas".
Para cada pregunta:
- "numero": entero 1..n
- "respuesta_correcta": "A" | "B" | "C" | "D" (si ves "Respuesta: b) 1492", la letra es "B")

Reglas:
- NO inventes preguntas ni saltes números.
- Si el texto muestra "Respuesta: b) 1492", solo te interesa la letra ("B").
- Si no hay letra clara, omite la pregunta (no adivines).
- Devuelve SOLO JSON válido.

# TEXTO DEL EXAMEN (DOCENTE / CLAVE)
${texto}

# DOS EJEMPLOS
Texto:
1. ¿Capital de Francia?
a) Roma
b) París
c) Madrid
d) Lisboa
Respuesta: b) París

2) ¿2+2?
a) 3
b) 4
c) 5
d) 22
Respuesta: b

Salida JSON:
{"preguntas":[{"numero":1,"respuesta_correcta":"B"},{"numero":2,"respuesta_correcta":"B"}]}
`;

  const schemaHint = `{"preguntas":[{"numero":1,"respuesta_correcta":"B"}]}`;
  const out = await ollamaJSON({ prompt, jsonSchemaHint: schemaHint });
  const preguntas = Array.isArray(out.preguntas) ? out.preguntas : [];
  return preguntas
    .map(p => ({
      numero: Number(p.numero),
      enunciado: "",
      alternativas: [],
      respuesta_correcta: letraABCD(p.respuesta_correcta)
    }))
    .filter(p => Number.isInteger(p.numero) && p.numero > 0 && !!p.respuesta_correcta);
}


// === extrae RESPUESTAS DEL ALUMNO (desde su PDF)
async function extraerResAlumnoDesdeTextoLLM(texto) {
  // 1) Intento determinista (regex)
  const rx = extraerRespuestasPorRegex(texto);
  if (rx.length > 0) {
    return rx.map(r => ({
      numero: r.numero,
      respuesta_alumno: r.respuesta,
      justificacion: ""
    }));
  }

  // 2) Fallback LLM (few-shot + formato estricto)
  const prompt = `
Eres un extractor estricto de RESPUESTAS del ALUMNO desde un examen resuelto en texto.
Tu tarea: detectar cada pregunta en ORDEN y devolver SOLO JSON con arreglo "respuestas".
Para cada respuesta:
- "numero": entero 1..n
- "respuesta_alumno": "A" | "B" | "C" | "D" (si ves "Respuesta: a) 1452", la letra es "A")

Reglas:
- NO inventes respuestas ni saltes números.
- Si el texto muestra "Respuesta: a) 1452", solo te interesa la letra ("A").
- Si no hay letra clara, omite la pregunta (no adivines).
- Devuelve SOLO JSON válido.

# TEXTO DEL EXAMEN (ALUMNO)
${texto}

# EJEMPLO
Texto:
1. ¿Capital de Francia?
a) Roma
b) París
c) Madrid
d) Lisboa
Respuesta: a) Roma

Salida JSON:
{"respuestas":[{"numero":1,"respuesta_alumno":"A"}]}
`;

  const schemaHint = `{"respuestas":[{"numero":1,"respuesta_alumno":"A"}]}`;
  const out = await ollamaJSON({ prompt, jsonSchemaHint: schemaHint });
  const respuestas = Array.isArray(out.respuestas) ? out.respuestas : [];
  return respuestas
    .map(r => ({
      numero: Number(r.numero),
      respuesta_alumno: letraABCD(r.respuesta_alumno),
      justificacion: ""
    }))
    .filter(r => Number.isInteger(r.numero) && r.numero > 0 && !!r.respuesta_alumno);
}


// === calificación (0..20); para abiertas: matching exacto ahora (ampliaremos rubricas luego)
function calificar(preguntasClave, respuestasAlumno) {
    const mapaAlumno = new Map(respuestasAlumno.map(r => [r.numero, r.respuesta_alumno]));
    const total = preguntasClave.length;
    if (total === 0) return { nota: 0, correctas: 0, total: 0, valorPregunta: 0, detalle: [] };

    let correctas = 0;
    const detalle = preguntasClave.map(p => {
        const ra = mapaAlumno.get(p.numero) || null;
        // criterio simple: coincidencia exacta (A/B/C/D o texto)
        const acierto = !!ra && ra.trim().toUpperCase() === p.respuesta_correcta.trim().toUpperCase();
        if (acierto) correctas++;
        return {
            numero: p.numero,
            correcta: p.respuesta_correcta,
            alumno: ra,
            acierto
        };
    });

    const valor = 20 / total;
    const nota = Math.round(correctas * valor * 100) / 100;
    return { nota, correctas, total, valorPregunta: Math.round(valor * 100) / 100, detalle };
}

function veredicto(prom, cursoNombre) {
    if (prom == null) return `No hay historial suficiente para el curso ${cursoNombre}.`;
    if (prom >= 16) return `El alumno es muy bueno en el curso ${cursoNombre}.`;
    if (prom >= 13) return `El alumno es bueno en el curso ${cursoNombre}.`;
    if (prom >= 11) return `El alumno es regular en el curso ${cursoNombre}.`;
    return `El alumno necesita refuerzo en el curso ${cursoNombre}.`;
}

// === API principal que usará tu endpoint /evaluaciones/:id/auto
export default async function evaluarAutomaticoLLM(evaluacionId) {
    // ... tu código actual SIN CAMBIOS dentro ...

    const db = await openDb();

    // Carga evaluación + examen (igual que antes)
    const ev = await db.get(
        `SELECT id, estudiante_id, examen_id, archivo_resuelto FROM evaluaciones WHERE id = ?`,
        [evaluacionId]
    );
    if (!ev) throw new Error("Evaluación no encontrada");

    const ex = await db.get(
        `SELECT id, nombre, curso_id, archivo FROM examenes WHERE id = ?`,
        [ev.examen_id]
    );
    if (!ex) throw new Error("Examen base no encontrado");

    // Lee PDFs a texto
    const baseAbs = path.resolve(process.cwd(), ex.archivo);
    const alumAbs = path.resolve(process.cwd(), ev.archivo_resuelto);
    const textoBase = await leerPDF(baseAbs);
    const textoAlumno = await leerPDF(alumAbs);

    // Extrae con LLM
    const preguntasClave = await extraerClaveDesdeTextoLLM(textoBase);
    const respuestasAlumno = await extraerResAlumnoDesdeTextoLLM(textoAlumno);

    // Califica
    const score = calificar(preguntasClave, respuestasAlumno);

    // Guarda nota
    await db.run(`UPDATE evaluaciones SET nota = ? WHERE id = ?`, [score.nota, ev.id]);

    // Detalle JSON
    await db.exec(`
    CREATE TABLE IF NOT EXISTS evaluacion_detalles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      evaluacion_id INTEGER NOT NULL,
      resumen_json TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (evaluacion_id) REFERENCES evaluaciones(id) ON DELETE CASCADE
    );
  `);

    const resumen = {
        examen: { id: ex.id, nombre: ex.nombre, curso_id: ex.curso_id },
        evaluacion_id: ev.id,
        total: score.total,
        correctas: score.correctas,
        valorPregunta: score.valorPregunta,
        nota: score.nota,
        preguntas: score.detalle
    };
    await db.run(
        `INSERT INTO evaluacion_detalles (evaluacion_id, resumen_json) VALUES (?, ?)`,
        [ev.id, JSON.stringify(resumen)]
    );

    // Veredicto por histórico
    const rowProm = await db.get(
        `
    SELECT AVG(eva.nota) AS prom
    FROM evaluaciones eva
    JOIN examenes ex2 ON ex2.id = eva.examen_id
    WHERE eva.estudiante_id = ?
      AND ex2.curso_id = ?
      AND eva.nota IS NOT NULL
    `,
        [ev.estudiante_id, ex.curso_id]
    );
    const prom = rowProm?.prom != null ? Number(rowProm.prom) : null;
    const curso = await db.get(`SELECT nombre FROM cursos WHERE id = ?`, [ex.curso_id]);
    const msg = veredicto(prom, curso?.nombre || "del curso");

    return {
        nota: score.nota,
        correctas: score.correctas,
        total: score.total,
        valorPregunta: score.valorPregunta,
        veredicto: msg,
        detalle: resumen
    };
}

export { evaluarAutomaticoLLM };

