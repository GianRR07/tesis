import express from "express";
import { openDb } from "../db.js";

const router = express.Router();

// Listar examenes
router.get("/", async (req, res) => {
  const db = await openDb();
  const examenes = await db.all("SELECT * FROM examenes");
  res.json(examenes);
});

// Crear examen
router.post("/", async (req, res) => {
  const { nombre, curso_id, archivo } = req.body;
  const db = await openDb();
  await db.run(
    "INSERT INTO examenes (nombre, curso_id, archivo) VALUES (?, ?, ?)",
    [nombre, curso_id, archivo]
  );
  res.json({ message: "Examen registrado" });
});

export default router;
