import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { openDb } from "../db.js";
import evaluarAutomaticoLLM from "../services/evaluador_llm.js";


const router = express.Router();

const uploadDir = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ts = Date.now();
    const safe = file.originalname.replace(/\s+/g, "_");
    cb(null, `${ts}_${safe}`);
  }
});
const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const ok = file.mimetype === "application/pdf";
    if (!ok) return cb(new Error("Solo se permite PDF"));
    cb(null, true);
  },
});

// POST /evaluaciones  (multipart)
// fields: examen_id, estudiante_id, docente_id, archivo_resuelto (pdf)
router.post("/", upload.single("archivo_resuelto"), async (req, res) => {
  try {
    const examen_id = Number(req.body?.examen_id);
    const estudiante_id = Number(req.body?.estudiante_id);
    const docente_id = Number(req.body?.docente_id); // <-- nuevo

    // Validaciones
    if (!Number.isInteger(examen_id) || !Number.isInteger(estudiante_id) || !Number.isInteger(docente_id)) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: "VALIDATION_ERROR", message: "examen_id, estudiante_id y docente_id requeridos" });
    }
    if (!req.file) {
      return res.status(400).json({ error: "VALIDATION_ERROR", message: "archivo_resuelto (PDF) es requerido" });
    }

    const db = await openDb();

    // Validar existencia de examen, estudiante y docente
    const ex = await db.get("SELECT id FROM examenes WHERE id = ?", [examen_id]);
    if (!ex) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: "VALIDATION_ERROR", message: "examen_id no existe" });
    }
    const est = await db.get("SELECT id FROM estudiantes WHERE id = ?", [estudiante_id]);
    if (!est) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: "VALIDATION_ERROR", message: "estudiante_id no existe" });
    }
    const doc = await db.get("SELECT id FROM docentes WHERE id = ?", [docente_id]);
    if (!doc) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: "VALIDATION_ERROR", message: "docente_id no existe" });
    }

    // Insertar la evaluación con docente_id
    const r = await db.run(
      `INSERT INTO evaluaciones (estudiante_id, examen_id, docente_id, nota, archivo_resuelto)
       VALUES (?, ?, ?, NULL, ?)`,
      [estudiante_id, examen_id, docente_id, path.join("uploads", path.basename(req.file.path))]
    );

    return res.status(201).json({ id: r.lastID, nota: null });

  } catch (err) {
    console.error(err);
    try { if (req.file) fs.unlinkSync(req.file.path); } catch {}
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});


router.post("/:id/auto", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "VALIDATION_ERROR", message: "id inválido" });
    }

    // Llamar al evaluador automático (Hermes)
    const out = await evaluarAutomaticoLLM(id);

    // out debería devolver algo como:
    // { nota: 14.5, veredicto: "El alumno necesita refuerzo en el tema de microbiología" }

    const db = await openDb();

    // Guardamos los resultados en la tabla evaluaciones
    await db.run(
      `UPDATE evaluaciones SET nota = ?, veredicto = ? WHERE id = ?`,
      [out.nota ?? null, out.veredicto ?? null, id]
    );

    console.log(`🧠 Evaluación ${id} actualizada con nota/veredicto.`);
    return res.json(out);
  } catch (err) {
    console.error(err);
    return res.status(400).json({ error: "EVALUATION_ERROR", message: err.message });
  }
});


// --- tus endpoints POST ya existentes aquí ---

// 📊 NUEVO: obtener promedio general por estudiante
router.get("/metricas/estudiantes", async (req, res) => {
  try {
    const db = await openDb();
    const result = await db.all(`
      SELECT 
        e.id AS estudiante_id,
        e.nombre AS estudiante,
        ROUND(AVG(ev.nota), 2) AS promedio_general
      FROM estudiantes e
      JOIN evaluaciones ev ON e.id = ev.estudiante_id
      GROUP BY e.id
      ORDER BY promedio_general DESC
    `);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DB_ERROR", message: err.message });
  }
});

// 📊 NUEVO: promedio por curso de cada estudiante
router.get("/metricas/curso", async (req, res) => {
  try {
    const db = await openDb();
    const result = await db.all(`
      SELECT 
        e.id AS estudiante_id,
        e.nombre AS estudiante,
        c.nombre AS curso,
        ROUND(AVG(ev.nota), 2) AS promedio_curso
      FROM evaluaciones ev
      JOIN examenes ex ON ev.examen_id = ex.id
      JOIN cursos c ON ex.curso_id = c.id
      JOIN estudiantes e ON ev.estudiante_id = e.id
      GROUP BY e.id, c.id
      ORDER BY e.nombre, c.nombre
    `);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DB_ERROR", message: err.message });
  }
});

// 📊 NUEVO: promedio por aula (rendimiento global)
router.get("/metricas/aulas", async (req, res) => {
  try {
    const db = await openDb();
    const result = await db.all(`
      SELECT 
        a.nombre AS aula,
        ROUND(AVG(ev.nota), 2) AS promedio_aula
      FROM evaluaciones ev
      JOIN estudiantes e ON ev.estudiante_id = e.id
      JOIN estudiantes_aulas ea ON e.id = ea.estudiante_id
      JOIN aulas a ON ea.aula_id = a.id
      GROUP BY a.id
    `);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DB_ERROR", message: err.message });
  }
});

export default router;

