import express from "express";
import { openDb } from "../db.js";

const router = express.Router();

// Listar aulas (con nombre de tutor si existe)
router.get("/", async (req, res) => {
  try {
    const db = await openDb();
    const aulas = await db.all(`
      SELECT 
        a.id,
        a.nombre,
        a.grado,
        a.seccion,
        a.tutor_id,
        t.nombre AS tutor_nombre
      FROM aulas a
      LEFT JOIN tutores t ON t.id = a.tutor_id
      ORDER BY a.id DESC
    `);
    res.json(aulas);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});
// Crear aula (deriva docente desde la tabla cursos, con coerción segura)
router.post("/", async (req, res) => {
  let { nombre, grado, seccion, cursos } = req.body;
  // cursos: number[] (IDs)

  if (!nombre || !grado || !seccion) {
    return res.status(400).json({
      error: "VALIDATION_ERROR",
      message: "nombre, grado y seccion son obligatorios",
    });
  }

  // Normaliza cursos a enteros válidos
  const ids = Array.isArray(cursos)
    ? cursos.map(x => Number(x)).filter(n => Number.isInteger(n) && n > 0)
    : [];

  if (Array.isArray(cursos) && ids.length !== cursos.length) {
    return res.status(400).json({
      error: "VALIDATION_ERROR",
      message: "Hay curso(s) con ID inválido en la lista enviada",
    });
  }

  let db;
  try {
    db = await openDb();
    await db.exec("BEGIN");

    const result = await db.run(
      "INSERT INTO aulas (nombre, grado, seccion, tutor_id) VALUES (?, ?, ?, NULL)",
      [nombre, grado, seccion]
    );
    const aulaId = result.lastID;

    if (ids.length > 0) {
      for (const cursoId of ids) {
        const row = await db.get("SELECT docente_id FROM cursos WHERE id = ?", [cursoId]);
        if (!row) {
          throw new Error(`El curso con id=${cursoId} no existe`);
        }
        const docenteId = row.docente_id ?? null;

        await db.run(
          "INSERT INTO aulas_cursos (aula_id, curso_id, docente_id) VALUES (?, ?, ?)",
          [aulaId, cursoId, docenteId]
        );
      }
    }

    await db.exec("COMMIT");
    return res.status(201).json({ message: "Aula registrada", id: aulaId });
  } catch (err) {
    console.error(err);
    if (db) { try { await db.exec("ROLLBACK"); } catch {} }
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});


export default router;
