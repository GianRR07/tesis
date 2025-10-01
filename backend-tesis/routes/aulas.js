import express from "express";
import { openDb } from "../db.js";

const router = express.Router();

// Listar aulas
router.get("/", async (req, res) => {
  const db = await openDb();
  const aulas = await db.all("SELECT * FROM aulas");
  res.json(aulas);
});

// Crear aula
router.post("/", async (req, res) => {
  const { nombre, tutor_id } = req.body;
  const db = await openDb();
  await db.run("INSERT INTO aulas (nombre, tutor_id) VALUES (?, ?)", [
    nombre,
    tutor_id || null,
  ]);
  res.json({ message: "Aula registrada" });
});

export default router;
