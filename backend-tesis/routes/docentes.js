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

// Actualizar docente (datos básicos; no cambia password aquí)
router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { nombre, email, telefono, cursos_que_ensena, correo_ingreso } = req.body;

  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "VALIDATION_ERROR", message: "ID inválido" });
  }
  if (!nombre || !email || !correo_ingreso) {
    return res.status(400).json({ error: "VALIDATION_ERROR", message: "Faltan campos: nombre, email, correo_ingreso" });
  }

  try {
    const db = await openDb();

    const existe = await db.get("SELECT id FROM docentes WHERE id = ?", [id]);
    if (!existe) {
      return res.status(404).json({ error: "NOT_FOUND", message: "Docente no encontrado" });
    }

    await db.run(
      `UPDATE docentes
       SET nombre = ?, email = ?, telefono = ?, cursos_que_ensena = ?, correo_ingreso = ?
       WHERE id = ?`,
      [nombre, email, telefono ?? null, cursos_que_ensena ?? "", correo_ingreso, id]
    );

    return res.json({ id, nombre, email, telefono, cursos_que_ensena, correo_ingreso });
  } catch (err) {
    console.error(err);
    // UNIQUE(email/correo_ingreso) podría romper
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});


// ===== NUEVO: Aulas donde enseña un docente =====
// GET /docentes/:id/aulas  (?cursoId=opcional)
router.get("/:id/aulas", async (req, res) => {
  const docenteId = Number(req.params.id);
  const { cursoId } = req.query;

  if (!Number.isInteger(docenteId)) {
    return res.status(400).json({ error: "VALIDATION_ERROR", message: "docenteId inválido" });
  }

  try {
    const db = await openDb();
    const params = [docenteId];
    let sql = `
      SELECT a.id, a.nombre, a.grado, a.seccion,
             GROUP_CONCAT(DISTINCT c.nombre) AS cursos
      FROM aulas_cursos ac
      JOIN aulas a ON a.id = ac.aula_id
      JOIN cursos c ON c.id = ac.curso_id
      WHERE ac.docente_id = ?
    `;
    if (cursoId) { sql += ` AND ac.curso_id = ?`; params.push(Number(cursoId)); }
    sql += ` GROUP BY a.id ORDER BY a.grado, a.seccion`;

    const aulas = await db.all(sql, params);
    res.json(aulas);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "INTERNAL_ERROR", message: e.message });
  }
});

// ===== NUEVO: Estudiantes de un aula (vía docente) =====
// GET /docentes/:id/estudiantes?aulaId=NN
router.get("/:id/estudiantes", async (req, res) => {
  const aulaId = Number(req.query.aulaId);
  if (!Number.isInteger(aulaId)) {
    return res.status(400).json({ error: "VALIDATION_ERROR", message: "aulaId requerido y numérico" });
  }

  try {
    const db = await openDb();
    const estudiantes = await db.all(
      `
      SELECT e.id, e.nombre
      FROM estudiantes_aulas ea
      JOIN estudiantes e ON e.id = ea.estudiante_id
      WHERE ea.aula_id = ?
      ORDER BY e.nombre
      `,
      [aulaId]
    );
    res.json(estudiantes);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "INTERNAL_ERROR", message: e.message });
  }
});



export default router;
