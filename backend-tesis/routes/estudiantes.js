import express from "express";
import { openDb } from "../db.js";

const router = express.Router();

// Listar estudiantes
router.get("/", async (req, res) => {
  const db = await openDb();
  const estudiantes = await db.all("SELECT * FROM estudiantes");
  res.json(estudiantes);
});

// Crear estudiante
router.post("/", async (req, res) => {
  const { nombre } = req.body;
  const db = await openDb();
  await db.run("INSERT INTO estudiantes (nombre) VALUES (?)", [nombre]);
  res.json({ message: "Estudiante registrado" });
});

export default router;
