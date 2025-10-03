import express from "express";
import { openDb } from "../db.js";

const router = express.Router();

// Listar cursos
router.get("/", async (req, res) => {
  const db = await openDb();
  const cursos = await db.all("SELECT * FROM cursos");
  res.json(cursos);
});

// Crear curso (con docente asignado)
router.post("/", async (req, res) => {
  try {
    const { nombre, docenteId } = req.body;

    if (!nombre) {
      return res.status(400).json({ error: "VALIDATION_ERROR", message: "El nombre es obligatorio" });
    }
    // docenteId puede ser opcional, pero si viene, validamos que exista
    const db = await openDb();

    if (docenteId) {
      const existe = await db.get("SELECT id FROM docentes WHERE id = ?", [docenteId]);
      if (!existe) {
        return res.status(400).json({ error: "VALIDATION_ERROR", message: "Docente no existe" });
      }
    }

    await db.run(
      "INSERT INTO cursos (nombre, docente_id) VALUES (?, ?)",
      [nombre, docenteId ?? null]
    );

    return res.status(201).json({ message: "Curso registrado" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});


export default router;
