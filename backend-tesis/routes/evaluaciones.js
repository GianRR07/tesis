import express from "express";
import { openDb } from "../db.js";

const router = express.Router();

// Listar evaluaciones
router.get("/", async (req, res) => {
  const db = await openDb();
  const evaluaciones = await db.all("SELECT * FROM evaluaciones");
  res.json(evaluaciones);
});

// Crear evaluación
router.post("/", async (req, res) => {
  const { estudiante_id, examen_id, nota, archivo_resuelto } = req.body;
  const db = await openDb();
  await db.run(
    "INSERT INTO evaluaciones (estudiante_id, examen_id, nota, archivo_resuelto) VALUES (?, ?, ?, ?)",
    [estudiante_id, examen_id, nota, archivo_resuelto]
  );
  res.json({ message: "Evaluación registrada" });
});

export default router;
