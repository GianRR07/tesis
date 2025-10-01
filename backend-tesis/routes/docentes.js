import express from "express";
import { openDb } from "../db.js";

const router = express.Router();

// Listar docentes
router.get("/", async (req, res) => {
  const db = await openDb();
  const docentes = await db.all("SELECT * FROM docentes");
  res.json(docentes);
});

// Crear docente
router.post("/", async (req, res) => {
  const { nombre, email } = req.body;
  const db = await openDb();
  await db.run("INSERT INTO docentes (nombre, email) VALUES (?, ?)", [
    nombre,
    email,
  ]);
  res.json({ message: "Docente registrado" });
});

export default router;
