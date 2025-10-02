// backend-tesis/routes/docentes.js
import express from "express";
import bcrypt from "bcryptjs";
import { openDb } from "../db.js";

const router = express.Router();

// Listar docentes (oculta password_hash)
router.get("/", async (req, res) => {
  try {
    const db = await openDb();
    const docentes = await db.all(`
      SELECT id, nombre, email, telefono, cursos_que_ensena, correo_ingreso
      FROM docentes
    `);
    res.json(docentes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});


// Eliminar docente por ID
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "VALIDATION_ERROR", message: "ID inválido" });
    }
    const db = await openDb();

    // Opcional: validar existencia
    const existe = await db.get("SELECT id FROM docentes WHERE id = ?", [id]);
    if (!existe) {
      return res.status(404).json({ error: "NOT_FOUND", message: "Docente no encontrado" });
    }

    await db.run("DELETE FROM docentes WHERE id = ?", [id]);
    return res.status(204).send(); // No Content
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// Crear docente (guarda todos los campos + hash de contraseña)
router.post("/", async (req, res) => {
  try {
    const {
      nombre,
      correo: email,     // correo de contacto (desde el frontend)
      telefono,
      cursos: cursosRaw, // textarea del frontend
      correoIngreso,     // usuario para login
      contrasena         // texto plano; se hashea aquí
    } = req.body;

    if (!nombre || !email || !correoIngreso || !contrasena) {
      return res.status(400).json({
        error: "VALIDATION_ERROR",
        message: "Faltan campos obligatorios (nombre, correo, correoIngreso, contrasena)"
      });
    }

    // Normaliza cursos: guarda como texto con saltos de línea
    const cursos_que_ensena = (cursosRaw ?? "")
      .split(/\r?\n/)
      .map(s => s.trim())
      .filter(Boolean)
      .join("\n");

    // Hash de contraseña
    const password_hash = await bcrypt.hash(contrasena, 10);

    const db = await openDb();
    await db.run(
      `INSERT INTO docentes (nombre, email, telefono, cursos_que_ensena, correo_ingreso, password_hash)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [nombre, email, telefono ?? null, cursos_que_ensena, correoIngreso, password_hash]
    );

    return res.status(201).json({ message: "Docente registrado" });
  } catch (err) {
    console.error(err);
    // Ej: violación de UNIQUE en email o correo_ingreso
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

export default router;
