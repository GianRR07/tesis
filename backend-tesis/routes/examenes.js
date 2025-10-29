import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { openDb } from "../db.js";

const router = express.Router();

// carpeta de subida
const uploadDir = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// configuración multer
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

// POST /examenes  (multipart)  fields: nombre, curso_id, archivo (pdf)
router.post("/", upload.single("archivo"), async (req, res) => {
  try {
    const { nombre, curso_id } = req.body || {};
    if (!nombre?.trim() || !Number.isInteger(Number(curso_id))) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: "VALIDATION_ERROR", message: "nombre y curso_id son requeridos" });
    }
    if (!req.file) {
      return res.status(400).json({ error: "VALIDATION_ERROR", message: "archivo (PDF) es requerido" });
    }

    const db = await openDb();
    // validar curso
    const curso = await db.get("SELECT id FROM cursos WHERE id = ?", [Number(curso_id)]);
    if (!curso) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: "VALIDATION_ERROR", message: "curso_id no existe" });
    }

    const r = await db.run(
      `INSERT INTO examenes (nombre, curso_id, archivo) VALUES (?, ?, ?)`,
      [nombre.trim(), Number(curso_id), path.join("uploads", path.basename(req.file.path))]
    );

    return res.status(201).json({ id: r.lastID, nombre: nombre.trim() });
  } catch (err) {
    console.error(err);
    try { if (req.file) fs.unlinkSync(req.file.path); } catch {}
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

export default router;
