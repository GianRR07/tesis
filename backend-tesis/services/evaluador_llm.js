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
async function ollamaJSON({ model = OLLAMA_MODEL, prompt, jsonSchemaHint }) {
  const body = {
    model,
    prompt: `${prompt}

# FORMATO DE SALIDA
Devuelve SOLO un JSON válido y NADA MÁS. Sin explicaciones, sin texto adicional.
${jsonSchemaHint || ""}`,
    stream: false,
    format: "json",
    options: {
      temperature: 0,
      num_ctx: 2048,
      top_k: 20
    }
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

// --- Helpers para respuestas abiertas
function limpiarLinea(s) {
  return String(s || "")
    .replace(/\s+/g, " ")
    .replace(/^[:\-–]\s*/, "")
    .trim();
}

// --------------------------------------------------------------------------------------
// PARSERS DETERMINISTAS (globales, sin funciones anidadas)
// --------------------------------------------------------------------------------------

// Divide el texto por preguntas: "1.", "2)", "3 -", o "Pregunta 1:"
function partirPorPreguntas(texto) {
  const re = /(^\s*(?:pregunta\s*)?(\d{1,3})\s*[\)\.\-:])/gmi;
  const out = [];
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

// Extrae plano: "Pregunta N ... Respuesta: <texto>" (aunque falle partirPorPreguntas)
function extraerQResPlano(texto) {
  const res = [];
  const re = /pregunta\s*(\d{1,3})\s*[:\)\.\-][\s\S]*?respuesta\s*:\s*(.+?)(?=(?:\n\s*pregunta\s*\d{1,3}\s*[:\)\.\-]|$))/gmi;
  let m;
  while ((m = re.exec(texto)) !== null) {
    const numero = Number(m[1]);
    const respuesta_texto = limpiarLinea(m[2]);
    if (Number.isInteger(numero) && respuesta_texto) res.push({ numero, respuesta_texto });
  }
  return res; // [{numero, respuesta_texto}]
}

// ABIERTO: "Respuesta: <texto>" (descarta si es solo A/B/C/D)
function extraerRespuestasTextoPorRegex(texto) {
  const bloques = partirPorPreguntas(texto);
  const result = [];

  if (bloques.length > 0) {
    for (const b of bloques) {
      const m = b.chunk.match(/Respuesta\s*:\s*(.+)$/gmi);
      if (m && m.length > 0) {
        const linea = m[m.length - 1].split(":")[1];
        const textoRes = limpiarLinea(linea);
        if (textoRes) {
          // Si EMPIEZA con A-D (con o sin texto), la consideramos CERRADA → no la ponemos como abierta
          const empiezaConLetra = /^[\s\(\[\{]*([a-dA-D])[\s\)\]\}\.:;\-]/m.test(textoRes);
          if (!empiezaConLetra) {
            result.push({ numero: b.n, respuesta_texto: textoRes });
          }
        }
      }
    }
    return result;
  }

  // Sin bloques → modo plano
  const plano = extraerQResPlano(texto);
  return plano.filter(it => {
    const t = it.respuesta_texto || "";
    const empiezaConLetra = /^[\s\(\[\{]*([a-dA-D])[\s\)\]\}\.:;\-]/m.test(t);
    return !empiezaConLetra;
  });
}


// CERRADA: "Respuesta: A/B/C/D" (solo letra pura)
function extraerRespuestasCerradasPorRegex(texto) {
  const bloques = partirPorPreguntas(texto);
  const result = [];
  const tomarLetra = (s) => {
    const mm = String(s || "").match(/^[\s\(\[\{]*([a-dA-D])[\s\)\]\}\.:;\-]*.*$/m);
    return mm ? mm[1].toUpperCase() : null;
  };

  if (bloques.length > 0) {
    for (const b of bloques) {
      const m = b.chunk.match(/Respuesta\s*:\s*(.+)$/gmi);
      if (m && m.length > 0) {
        const linea = m[m.length - 1].split(":")[1];
        const letra = tomarLetra(limpiarLinea(linea));
        if (letra) result.push({ numero: b.n, respuesta: letra });
      }
    }
    return result;
  }

  const plano = extraerQResPlano(texto);
  return plano
    .map(it => ({ numero: it.numero, respuesta: tomarLetra(it.respuesta_texto) }))
    .filter(it => !!it.respuesta);
}

// --- Map por número
function mapearPorNumero(arr, campo = "numero") {
  const m = new Map();
  for (const it of arr || []) {
    if (Number.isInteger(it?.[campo])) m.set(it[campo], it);
  }
  return m;
}

// --------------------------------------------------------------------------------------
// EXTRACCIÓN DOCENTE / ALUMNO
// --------------------------------------------------------------------------------------

// extrae la CLAVE del examen (del PDF del docente) soportando cerradas y abiertas
async function extraerClaveDesdeTextoLLM(texto) {
  // 1) saca ambas por regex
  const rxCerradas = extraerRespuestasCerradasPorRegex(texto);   // [{numero, respuesta}]
  const rxAbiertas = extraerRespuestasTextoPorRegex(texto);      // [{numero, respuesta_texto}]

  if (rxCerradas.length || rxAbiertas.length) {
    const m = new Map();

    for (const r of rxAbiertas) {
      m.set(r.numero, {
        numero: r.numero,
        tipo: "abierta",
        enunciado: "",
        alternativas: [],
        respuesta_correcta: null,
        respuesta_correcta_texto: r.respuesta_texto
      });
    }
    for (const r of rxCerradas) {
      // si existe abierta del mismo número, la cerrada pisa (preferimos cerrada)
      m.set(r.numero, {
        numero: r.numero,
        tipo: "cerrada",
        enunciado: "",
        alternativas: [],
        respuesta_correcta: r.respuesta, // "A"|"B"|"C"|"D"
        respuesta_correcta_texto: null
      });
    }

    return [...m.values()].sort((a, b) => a.numero - b.numero);
  }

  // 2) Fallback LLM (igual que antes)
  console.warn("[ExtractorClave] Cayendo a LLM fallback");
  const prompt = `
Eres un extractor estricto de CLAVE DE RESPUESTAS desde un examen en texto.
Devuelve SOLO JSON. Para cada pregunta indica:
- "tipo": "cerrada" (A/B/C/D) o "abierta" (texto).
# TEXTO
${texto}
# Ejemplo:
{"preguntas":[{"numero":1,"tipo":"cerrada","respuesta_correcta":"B"}]}
`;
  const schemaHint = `{"preguntas":[{"numero":1,"tipo":"cerrada","respuesta_correcta":"B"}]}`;
  const out = await ollamaJSON({ prompt, jsonSchemaHint: schemaHint });
  const preguntas = Array.isArray(out.preguntas) ? out.preguntas : [];
  return preguntas
    .map(p => ({
      numero: Number(p.numero),
      tipo: p.tipo === "abierta" ? "abierta" : "cerrada",
      enunciado: "",
      alternativas: [],
      respuesta_correcta: p.tipo === "cerrada" ? letraABCD(p.respuesta_correcta) : null,
      respuesta_correcta_texto: p.tipo === "abierta" ? limpiarLinea(p.respuesta_correcta_texto) : null
    }))
    .filter(p => Number.isInteger(p.numero) && p.numero > 0 && (p.respuesta_correcta || p.respuesta_correcta_texto));
}


// extrae RESPUESTAS DEL ALUMNO (desde su PDF) soportando cerradas y abiertas
async function extraerResAlumnoDesdeTextoLLM(texto) {
  // 1) Cerradas por regex
  const rxCerradas = extraerRespuestasCerradasPorRegex(texto);
  const arrCerradas = rxCerradas.map(r => ({
    numero: r.numero,
    tipo: "cerrada",
    respuesta_alumno: r.respuesta,
    respuesta_alumno_texto: null,
    justificacion: ""
  }));

  // 2) Abiertas por regex
  const rxAbiertas = extraerRespuestasTextoPorRegex(texto).map(r => ({
    numero: r.numero,
    tipo: "abierta",
    respuesta_alumno: null,
    respuesta_alumno_texto: r.respuesta_texto,
    justificacion: ""
  }));

  if (arrCerradas.length > 0 || rxAbiertas.length > 0) {
    // Unimos por numero (si hay doble, priorizamos cerrada explícita)
    const m = new Map();
    for (const it of [...arrCerradas, ...rxAbiertas]) m.set(it.numero, it);
    return [...m.values()].sort((a, b) => a.numero - b.numero);
  }

  // 3) Fallback LLM
  console.warn("[ExtractorAlumno] Cayendo a LLM fallback");
  const prompt = `
Eres un extractor estricto de RESPUESTAS del ALUMNO.
Devuelve SOLO JSON con arreglo "respuestas".
Cada ítem:
- "numero": entero
- "tipo": "cerrada" | "abierta"
- si "cerrada": "respuesta_alumno": "A" | "B" | "C" | "D"
- si "abierta": "respuesta_alumno_texto": string (texto literal o resumido fielmente)

Reglas:
- NO inventes respuestas.
- Devuelve SOLO JSON válido.

# TEXTO (ALUMNO)
${texto}

# Ejemplo de salida:
{"respuestas":[
  {"numero":1,"tipo":"cerrada","respuesta_alumno":"A"},
  {"numero":2,"tipo":"abierta","respuesta_alumno_texto":"Es el proceso ..."}
]}
`;

  const schemaHint = `{"respuestas":[{"numero":1,"tipo":"cerrada","respuesta_alumno":"A"}]}`;
  const out = await ollamaJSON({ prompt, jsonSchemaHint: schemaHint });
  const respuestas = Array.isArray(out.respuestas) ? out.respuestas : [];
  return respuestas
    .map(r => ({
      numero: Number(r.numero),
      tipo: r.tipo === "abierta" ? "abierta" : "cerrada",
      respuesta_alumno: r.tipo === "cerrada" ? letraABCD(r.respuesta_alumno) : null,
      respuesta_alumno_texto: r.tipo === "abierta" ? limpiarLinea(r.respuesta_alumno_texto) : null,
      justificacion: ""
    }))
    .filter(r => Number.isInteger(r.numero) && r.numero > 0 && (r.respuesta_alumno || r.respuesta_alumno_texto));
}

// --------------------------------------------------------------------------------------
// PUNTUACIÓN ABIERTA
// --------------------------------------------------------------------------------------

async function puntuarAbiertaLLM({ numero, enunciado, respuestaDocente, respuestaAlumno }) {
  const prompt = `
Eres un evaluador objetivo de respuestas abiertas para ciencias.
Devuelve SOLO JSON con: "score" (0..1 en 0, 0.25, 0.5, 0.75, 1.0) y "feedback" (máx 240 caracteres).
Responde SIEMPRE en español (variedad neutral, clara y breve).
Evalúa con:
1) Exactitud científica (0-0.4)
2) Cobertura de ideas clave (0-0.4)
3) Claridad y completitud (0-0.2)

Si la respuesta del alumno es vacía o fuera de tema, score=0 y feedback breve en español.

# PREGUNTA #${numero}
${enunciado || "(sin enunciado en fuente)"}

# RESPUESTA OFICIAL (docente)
${respuestaDocente}

# RESPUESTA ALUMNO
${respuestaAlumno}

# Salida JSON:
{"score":0.75,"feedback":"..."}
`;
  const schemaHint = `{"score":0.75,"feedback":"texto en español"}`;
  try {
    const out = await ollamaJSON({ prompt, jsonSchemaHint: schemaHint });
    const s = Math.max(0, Math.min(1, Number(out.score)));
    const fb = limpiarLinea(out.feedback || "");
    return { score: isFinite(s) ? s : 0, feedback: fb || "" };
  } catch (_e) {
    // fallback conservador
    return { score: 0, feedback: "No se pudo evaluar automáticamente esta respuesta." };
  }
}

// --------------------------------------------------------------------------------------
// CALIFICACIÓN (paralelizada)
// --------------------------------------------------------------------------------------

async function calificar(preguntasClave, respuestasAlumno) {
  const mapaAlumno = mapearPorNumero(respuestasAlumno);
  const total = preguntasClave.length;
  if (total === 0) return { nota: 0, correctas: 0, total: 0, valorPregunta: 0, detalle: [] };

  const valor = 20 / total;

  // Prepara evaluaciones sin bloquear
  const evaluaciones = preguntasClave.map((p) => {
    const r = mapaAlumno.get(p.numero);

    if (!r) {
      return Promise.resolve({
        numero: p.numero,
        tipo: p.tipo,
        correcta: p.respuesta_correcta || p.respuesta_correcta_texto,
        alumno: null,
        acierto: false,
        puntaje: 0,
        puntos: 0,
        feedback: p.tipo === "abierta" ? "Sin respuesta." : ""
      });
    }

    if (p.tipo === "cerrada") {
      const ra = r.respuesta_alumno || null;
      const acierto = !!ra && ra.trim().toUpperCase() === p.respuesta_correcta.trim().toUpperCase();
      return Promise.resolve({
        numero: p.numero,
        tipo: "cerrada",
        correcta: p.respuesta_correcta,
        alumno: ra,
        acierto,
        puntaje: acierto ? 1 : 0,
        puntos: acierto ? valor : 0,
        feedback: acierto ? "" : "Respuesta incorrecta."
      });
    } else {
      // ABIERTA
      const respDoc = p.respuesta_correcta_texto || "";
      const respAlu = r.respuesta_alumno_texto || "";
      return puntuarAbiertaLLM({
        numero: p.numero,
        enunciado: p.enunciado || "",
        respuestaDocente: respDoc,
        respuestaAlumno: respAlu
      }).then(({ score, feedback }) => ({
        numero: p.numero,
        tipo: "abierta",
        correcta: respDoc,
        alumno: respAlu,
        acierto: score === 1,
        puntaje: Math.round(score * 100) / 100,
        puntos: Math.round(score * valor * 100) / 100,
        feedback
      })).catch(() => ({
        numero: p.numero,
        tipo: "abierta",
        correcta: respDoc,
        alumno: respAlu,
        acierto: false,
        puntaje: 0,
        puntos: 0,
        feedback: "No se pudo evaluar automáticamente esta respuesta."
      }));
    }
  });

  const detalle = await Promise.all(evaluaciones);

  const acumulado = detalle.reduce((s, d) => s + (d.puntaje || 0), 0);
  const correctas = detalle.reduce((s, d) => s + (d.puntaje === 1 ? 1 : 0), 0);

  const nota = Math.round((acumulado * valor) * 100) / 100;
  return {
    nota,
    correctas,
    total,
    valorPregunta: Math.round(valor * 100) / 100,
    detalle
  };
}

function veredicto(prom, cursoNombre) {
  if (prom == null) return `No hay historial suficiente para el curso ${cursoNombre}.`;
  if (prom >= 16) return `El alumno es muy bueno en el curso ${cursoNombre}.`;
  if (prom >= 13) return `El alumno es bueno en el curso ${cursoNombre}.`;
  if (prom >= 11) return `El alumno es regular en el curso ${cursoNombre}.`;
  return `El alumno necesita refuerzo en el curso ${cursoNombre}.`;
}

// --------------------------------------------------------------------------------------
// API principal
// --------------------------------------------------------------------------------------

export default async function evaluarAutomaticoLLM(evaluacionId) {
  const db = await openDb();

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

  // Extrae con parsers / LLM
  const preguntasClave = await extraerClaveDesdeTextoLLM(textoBase);
  const respuestasAlumno = await extraerResAlumnoDesdeTextoLLM(textoAlumno);

  // Califica
  const score = await calificar(preguntasClave, respuestasAlumno);

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
