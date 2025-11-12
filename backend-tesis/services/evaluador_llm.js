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

// === MEJORA: Cambio de Modelo a Llama 3 para mejor razonamiento/aritmética ===
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3:8b";

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
    // === MEJORA: Añadir console.error para debug si el LLM falla ===
    const responseText = data.response;
    try {
      return JSON.parse(responseText);
    } catch (e) {
      console.error("El modelo no devolvió JSON válido. Respuesta recibida:", responseText);
      throw new Error("El modelo no devolvió JSON válido. Ajusta el prompt o prueba con otra plantilla.");
    }
  } catch (_e) {
    throw new Error("Error interno al procesar la respuesta del LLM.");
  }
}

// --- Normaliza letras a A/B/C/D
function letraABCD(s) {
  if (!s) return null;
  const m = String(s).trim().match(/^[\(\s]*([a-dA-D])\b/);
  return m ? m[1].toUpperCase() : null;
}

// --- Helpers para respuestas abiertas (MEJORA: Limpieza Agresiva de Etiquetas)
function limpiarLinea(s) {
  // 1. Reemplaza múltiples espacios por uno solo
  let limpio = String(s || "").replace(/\s+/g, " ").trim();

  // 2. Elimina etiquetas de formato comunes (caso-insensible y global)
  limpio = limpio
    .replace(/\bProcedimiento\s*:\s*/gi, "")
    .replace(/\bResultado Final\s*:\s*/gi, "")
    .replace(/\bRespuesta Clave\s*:\s*/gi, "")
    .replace(/\bRespuesta Oficial\s*:\s*/gi, "")
    .trim();

  // 3. Limpieza de caracteres de inicio (tu lógica original)
  return limpio
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
  const rxCerradas = extraerRespuestasCerradasPorRegex(texto);  // [{numero, respuesta}]
  const rxAbiertas = extraerRespuestasTextoPorRegex(texto);    // [{numero, respuesta_texto}]

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
  // === MEJORA: Incluir ejemplo de abierta para guiar al LLM ===
  const schemaHint = `{"preguntas":[{"numero":1,"tipo":"cerrada","respuesta_correcta":"B"},{"numero":2,"tipo":"abierta","respuesta_correcta_texto":"el proceso es..."}]}`;
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
    // === MEJORA: Cambiamos el orden para que la CERRADA pise a la abierta, según la lógica deseada ===
    for (const it of [...rxAbiertas, ...arrCerradas]) m.set(it.numero, it);
    return [...m.values()].sort((a, b) => a.numero - b.numero);
  }

  // Asegurar que siempre sea un array vacío si no se encuentran respuestas
  return [];
}


// --------------------------------------------------------------------------------------
// PUNTUACIÓN ABIERTA (Mejorada: Detecta tipo y genera Feedback único)
// --------------------------------------------------------------------------------------

async function puntuarAbiertaLLM({ numero, enunciado, respuestaDocente, respuestaAlumno }) {
  const esConceptual =
    /proceso|sistema|estructura|definici[oó]n|explica|qu[eé] es/i.test(enunciado) ||
    /(biolog[íi]a|historia|literatura|filosof[íi]a)/i.test(enunciado);

  const esMatematico =
    /calcule|encuentre|despeje|ecuaci[oó]n|resuelva|demuestre/i.test(enunciado);

  let rubricaPrompt;

  if (esMatematico) {
    rubricaPrompt = `
Evalúa con la siguiente rúbrica para obtener el score (máximo 1.0):
1. Identificación de la Fórmula/Principio Algebraico correcto: (0 - 0.3 puntos)
2. Procedimiento/Desarrollo lógico y pasos intermedios correctos: (0 - 0.4 puntos)
3. Cálculo/Resultado final estrictamente CORRECTO: (0 - 0.3 puntos)

Si el alumno usa el principio correcto pero tiene un error de cálculo simple, debe ser evaluado como parcial (ej: 0.75).
`;
  } else {
    rubricaPrompt = `
Evalúa con la siguiente rúbrica estricta para obtener el score (máximo 1.0):
1. EXACTITUD CIENTÍFICA (CORRECTEZ Y AUSENCIA DE CONTRADICCIÓN): (0 - 0.7 puntos)
2. COBERTURA DE IDEAS CLAVE (Relevancia y Enfoque Directo): (0 - 0.2 puntos)
3. CLARIDAD y ORDEN: (0 - 0.1 puntos)

REGLA DE ERROR FATAL (PRIORIDAD):
A. Si la respuesta del alumno CONTRADICE la clave oficial, el score debe ser 0.00.
B. Si la respuesta es TOTALMENTE IRRELEVANTE, el score debe ser 0.00.
C. Si hay INEXACTITUD GRAVE pero parcial, el score máximo es 0.25.

Si la respuesta del alumno es vacía o incomprensible, el score debe ser 0.
`;
  }

  const prompt = `
Eres un evaluador objetivo y estricto. Tu tarea es comparar la respuesta del alumno con la respuesta clave oficial y otorgar un puntaje que refleje su precisión.

${rubricaPrompt}

Reglas generales adicionales:
1. Errores graves: Si la respuesta contiene información incorrecta que contradice completamente la clave oficial, el puntaje debe ser 0.0.
2. Respuestas irrelevantes o fuera de contexto: Si la respuesta no aborda correctamente la pregunta o es completamente fuera de tema, el puntaje debe ser 0.0.
3. Respuestas parcialmente correctas: Si la respuesta menciona algunos elementos correctos pero le falta información crucial, se debe otorgar un puntaje parcial, con un máximo de 0.75.
4. Respuestas completas y precisas: Si la respuesta es totalmente correcta, el puntaje debe ser 1.0.
5. Feedback: Genera un feedback claro y conciso sobre los errores, especificando qué información falta o está incorrecta.

Si la respuesta es incompleta o incoherente, asigna el puntaje más bajo posible.

INSTRUCCIONES:
- No debes generar explicaciones adicionales, solo el puntaje y el feedback.
- El feedback debe ser específico para que el alumno pueda mejorar en la siguiente evaluación.

# PREGUNTA #${numero}
${enunciado || "(sin enunciado en fuente)"}

# RESPUESTA CLAVE (Docente)
${respuestaDocente}

# RESPUESTA DEL ALUMNO
${respuestaAlumno}

# Salida JSON:
{"score":0.75,"feedback":"Aquí va el feedback único, NO este texto de ejemplo."}
`;

  const schemaHint = `{"score":0.75,"feedback":"texto descriptivo en español generado por el modelo"}`;

  try {
    const out = await ollamaJSON({ prompt, jsonSchemaHint: schemaHint });
    const s = Math.max(0, Math.min(1, Number(out.score)));
    const fb = limpiarLinea(out.feedback || "");
    return { score: isFinite(s) ? s : 0, feedback: fb || "" };
  } catch (_e) {
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

  // === NUEVO: Calcular las parciales ===
  const parciales = detalle.reduce((s, d) => s + (d.puntaje > 0 && d.puntaje < 1 ? 1 : 0), 0);
  // ===
  const incorrectas = total - correctas - parciales; // Por si acaso

  const nota = Math.round((acumulado * valor) * 100) / 100;
  return {
    nota,
    correctas,
    total,
    valorPregunta: Math.round(valor * 100) / 100,
    detalle,
    parciales: parciales,
    incorrectas: incorrectas
  };
}

function veredicto(prom, cursoNombre, respuestasDetalle) {
  // Verificar que respuestasDetalle es un array
  if (!Array.isArray(respuestasDetalle)) {
    console.error("Error: respuestasDetalle debe ser un array.");
    throw new Error("respuestasDetalle debe ser un array.");
  }
  // Continuar con la lógica del veredicto
  let mensaje = "";
  let recomendacion = "";
  let errorGrave = false;
  let erroresPorTema = {};

  // Detecta errores graves como contradicciones con la respuesta del profesor
  respuestasDetalle.forEach((detalle) => {
    if (detalle.acierto === false) {
      if (detalle.tipo === "cerrada" && detalle.alumno !== detalle.correcta) {
        errorGrave = true;
        if (!erroresPorTema[detalle.numero]) {
          erroresPorTema[detalle.numero] = { tipo: "cerrada", errores: [] };
        }
        erroresPorTema[detalle.numero].errores.push(`Error en la respuesta cerrada: Esperaba ${detalle.correcta}, pero se seleccionó ${detalle.alumno}.`);
      }
      if (detalle.tipo === "abierta" && detalle.alumno_texto && !detalle.correcta_texto.includes(detalle.alumno_texto)) {
        errorGrave = true;
        if (!erroresPorTema[detalle.numero]) {
          erroresPorTema[detalle.numero] = { tipo: "abierta", errores: [] };
        }
        erroresPorTema[detalle.numero].errores.push(`Error en la respuesta abierta: El texto dado por el alumno no coincide con la respuesta correcta.`);
      }
    }
  });

  // Continuar con la clasificación según el promedio y recomendaciones
  if (prom == null) {
    mensaje = `No hay historial suficiente para el curso ${cursoNombre}.`;
    recomendacion = "Por favor, asegúrese de tener suficientes evaluaciones registradas para poder proporcionar un análisis adecuado.";
  } else if (prom >= 17) {
    mensaje = `El alumno es muy bueno en el curso ${cursoNombre}.`;
    recomendacion = "Continúe estimulando su interés con desafíos adicionales y proyectos avanzados para mantener su motivación alta.";
  } else if (prom >= 14) {
    mensaje = `El alumno es bueno en el curso ${cursoNombre}.`;
    recomendacion = "Felicite al alumno por su desempeño. Para mejorar aún más, sugiera que profundice en áreas específicas o intente resolver problemas más complejos.";
  } else if (prom >= 12) {
    mensaje = `El alumno es regular en el curso ${cursoNombre}.`;
    recomendacion = "El alumno necesita enfocarse más en la comprensión de los conceptos fundamentales. Considere repasar los temas clave y proporcionarle más ejercicios prácticos.";
  } else {
    mensaje = `El alumno necesita refuerzo en el curso ${cursoNombre}.`;
    recomendacion = "Es recomendable que el alumno reciba apoyo adicional, tal vez con tutorías o material de repaso, para mejorar la comprensión de los conceptos básicos.";
  }

  // Si hubo errores graves, los detallamos y damos recomendaciones específicas
  if (errorGrave) {
    mensaje += " Se detectaron errores significativos en las respuestas. ";
    let erroresDetalle = [];
    for (const [numero, detalle] of Object.entries(erroresPorTema)) {
      erroresDetalle.push(`Pregunta ${numero}: ${detalle.errores.join(", ")}`);
    }
    recomendacion += ` Recomendaciones: ${erroresDetalle.join(" ")}`;
  }

  return `${mensaje} ${recomendacion}`;
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
  console.log("respuestasAlumno:", respuestasAlumno);  // Verifica que esto es un array
  const respuestasDetalle = Array.isArray(respuestasAlumno) ? respuestasAlumno : []; // Aseguramos que siempre sea un array

  // Ahora pasamos respuestasDetalle a la función veredicto

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
  // Veredicto basado en la calificación del examen actual
  const msg = veredicto(score.nota, curso?.nombre || "del curso", respuestasDetalle);
  //puedes crear una variable de mensaje 2 que si use el promedio total , algo asi "const msg = veredicto(prom, curso?.nombre || "del curso"); 


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
