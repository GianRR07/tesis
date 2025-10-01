import express from "express";
import { openDb } from "../db.js";

const router = express.Router();

// Listar cursos
router.get("/", async (req, res) => {
  const db = await openDb();
  const cursos = await db.all("SELECT * FROM cursos");
  res.json(cursos);
});

// Crear curso
router.post("/", async (req, res) => {
  const { nombre } = req.body;
  const db = await openDb();
  await db.run("INSERT INTO cursos (nombre) VALUES (?)", [nombre]);
  res.json({ message: "Curso registrado" });
});

export default router;
