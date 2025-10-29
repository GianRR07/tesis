import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { openDb } from "../db.js";

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
// fields: examen_id, estudiante_id, archivo_resuelto (pdf)
router.post("/", upload.single("archivo_resuelto"), async (req, res) => {
  try {
    const examen_id = Number(req.body?.examen_id);
    const estudiante_id = Number(req.body?.estudiante_id);

    if (!Number.isInteger(examen_id) || !Number.isInteger(estudiante_id)) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: "VALIDATION_ERROR", message: "examen_id y estudiante_id requeridos" });
    }
    if (!req.file) {
      return res.status(400).json({ error: "VALIDATION_ERROR", message: "archivo_resuelto (PDF) es requerido" });
    }

    const db = await openDb();
    // validar existencia
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

    const r = await db.run(
      `INSERT INTO evaluaciones (estudiante_id, examen_id, nota, archivo_resuelto)
       VALUES (?, ?, NULL, ?)`,
      [estudiante_id, examen_id, path.join("uploads", path.basename(req.file.path))]
    );

    return res.status(201).json({ id: r.lastID, nota: null });
  } catch (err) {
    console.error(err);
    try { if (req.file) fs.unlinkSync(req.file.path); } catch {}
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

export default router;
