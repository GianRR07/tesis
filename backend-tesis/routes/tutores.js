import express from "express";
import { openDb } from "../db.js";

const router = express.Router();

// Listar tutores
router.get("/", async (req, res) => {
  const db = await openDb();
  const tutores = await db.all("SELECT * FROM tutores");
  res.json(tutores);
});

// Crear tutor
router.post("/", async (req, res) => {
  const { nombre, email } = req.body;
  const db = await openDb();
  await db.run("INSERT INTO tutores (nombre, email) VALUES (?, ?)", [
    nombre,
    email,
  ]);
  res.json({ message: "Tutor registrado" });
});

export default router;
