import express from "express";
import { openDb } from "../db.js";

const router = express.Router();

/**
 * GET /aulas
 * Lista aulas con tutores (desde aula_tutores.tutor_id) y cursos (con docente asignado si hay).
 */
router.get("/", async (req, res) => {
  try {
    const db = await openDb();
    const aulas = await db.all(`
      SELECT 
        a.id,
        a.nombre,
        a.grado,
        a.seccion,
        a.tutor_id  -- legado, no lo usamos
      FROM aulas a
      ORDER BY a.id DESC
    `);

    for (const aula of aulas) {
      // TUTORES (nuevo esquema con tutor_id)
      const tutores = await db.all(
        `
        SELECT t.id, t.nombre
        FROM aula_tutores at
        JOIN tutores t ON t.id = at.tutor_id
        WHERE at.aula_id = ?
        ORDER BY t.nombre ASC
        `,
        [aula.id]
      );
      aula.tutores = tutores; // [{id, nombre}]

      // CURSOS del aula (docente asignado al curso si existe)
      const cursos = await db.all(
        `
        SELECT 
          c.id,
          c.nombre,
          ac.docente_id,
          d.nombre AS docente_nombre
        FROM aulas_cursos ac
        JOIN cursos c ON c.id = ac.curso_id
        LEFT JOIN docentes d ON d.id = ac.docente_id
        WHERE ac.aula_id = ?
        ORDER BY c.nombre ASC
        `,
        [aula.id]
      );
      aula.cursos = cursos; // [{id, nombre, docente_id, docente_nombre}]
    }

    res.json(aulas);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

/**
 * POST /aulas
 * Crea un aula y opcionalmente asocia cursos (heredando docente_id desde cursos).
 * body: { nombre, grado, seccion, cursos?: number[] }
 */
router.post("/", async (req, res) => {
  let { nombre, grado, seccion, cursos } = req.body;
  const ids = Array.isArray(cursos)
    ? cursos.map(Number).filter((n) => Number.isInteger(n) && n > 0)
    : [];

  if (!nombre || !grado || !seccion) {
    return res
      .status(400)
      .json({ error: "VALIDATION_ERROR", message: "nombre, grado y seccion son obligatorios" });
  }
  if (Array.isArray(cursos) && ids.length !== cursos.length) {
    return res
      .status(400)
      .json({ error: "VALIDATION_ERROR", message: "Hay curso(s) con ID inválido en la lista enviada" });
  }

  const db = await openDb();
  await db.exec("BEGIN");
  try {
    const result = await db.run(
      "INSERT INTO aulas (nombre, grado, seccion, tutor_id) VALUES (?, ?, ?, NULL)",
      [nombre, grado, seccion]
    );
    const aulaId = result.lastID;

    for (const cursoId of ids) {
      const row = await db.get("SELECT docente_id FROM cursos WHERE id = ?", [cursoId]);
      if (!row) throw new Error(`El curso con id=${cursoId} no existe`);
      const docenteId = row.docente_id ?? null;

      await db.run(
        "INSERT INTO aulas_cursos (aula_id, curso_id, docente_id) VALUES (?, ?, ?)",
        [aulaId, cursoId, docenteId]
      );
    }

    await db.exec("COMMIT");
    return res.status(201).json({ message: "Aula registrada", id: aulaId });
  } catch (err) {
    console.error(err);
    try { await db.exec("ROLLBACK"); } catch {}
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

/**
 * GET /aulas/:aulaId/tutores
 * Lista tutores del aula
 */
router.get("/:aulaId/tutores", async (req, res) => {
  const aulaId = Number(req.params.aulaId);
  if (!Number.isInteger(aulaId)) {
    return res.status(400).json({ error: "VALIDATION_ERROR", message: "aulaId inválido" });
  }
  try {
    const db = await openDb();
    const tutores = await db.all(
      `
      SELECT t.id, t.nombre
      FROM aula_tutores at
      JOIN tutores t ON t.id = at.tutor_id
      WHERE at.aula_id = ?
      ORDER BY t.nombre ASC
      `,
      [aulaId]
    );
    res.json(tutores);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

/**
 * POST /aulas/:aulaId/tutores
 * Asigna tutores (bulk) respetando máximo 2 por aula.
 * body: { tutoresIds: number[] }
 */
router.post("/:aulaId/tutores", async (req, res) => {
  const aulaId = Number(req.params.aulaId);
  const { tutoresIds } = req.body;

  if (!Number.isInteger(aulaId)) {
    return res.status(400).json({ error: "VALIDATION_ERROR", message: "aulaId inválido" });
  }
  if (!Array.isArray(tutoresIds) || tutoresIds.length === 0) {
    return res.status(400).json({ error: "VALIDATION_ERROR", message: "tutoresIds es requerido (array)" });
  }
  const ids = tutoresIds.map(Number).filter((n) => Number.isInteger(n) && n > 0);
  if (ids.length !== tutoresIds.length) {
    return res.status(400).json({ error: "VALIDATION_ERROR", message: "Hay tutor(es) con ID inválido" });
  }

  const db = await openDb();
  await db.exec("BEGIN");
  try {
    const actuales = await db.all("SELECT tutor_id FROM aula_tutores WHERE aula_id = ?", [aulaId]);
    const yaAsignados = new Set(actuales.map((r) => r.tutor_id));
    const nuevos = ids.filter((id) => !yaAsignados.has(id));

    const total = actuales.length + nuevos.length;
    if (total > 2) {
      throw new Error(`Máximo 2 tutores por aula. Ya hay ${actuales.length}, intentas agregar ${nuevos.length}.`);
    }

    if (nuevos.length > 0) {
      const placeholders = nuevos.map(() => "?").join(",");
      const validos = await db.all(`SELECT id FROM tutores WHERE id IN (${placeholders})`, nuevos);
      if (validos.length !== nuevos.length) throw new Error("Algún tutor no existe");
    }

    for (const tId of nuevos) {
      await db.run("INSERT INTO aula_tutores (aula_id, tutor_id) VALUES (?, ?)", [aulaId, tId]);
    }

    await db.exec("COMMIT");
    return res.status(201).json({ message: "Tutores asignados", agregados: nuevos });
  } catch (err) {
    console.error(err);
    try { await db.exec("ROLLBACK"); } catch {}
    return res.status(400).json({ error: "VALIDATION_ERROR", message: err.message });
  }
});

/**
 * DELETE /aulas/:aulaId/tutores/:tutorId
 * Quita un tutor del aula
 */
router.delete("/:aulaId/tutores/:tutorId", async (req, res) => {
  const aulaId = Number(req.params.aulaId);
  const tutorId = Number(req.params.tutorId);
  if (!Number.isInteger(aulaId) || !Number.isInteger(tutorId)) {
    return res.status(400).json({ error: "VALIDATION_ERROR", message: "IDs inválidos" });
  }

  try {
    const db = await openDb();
    const r = await db.run("DELETE FROM aula_tutores WHERE aula_id = ? AND tutor_id = ?", [aulaId, tutorId]);
    if (r.changes === 0) {
      return res.status(404).json({ error: "NOT_FOUND", message: "No había asignación para eliminar" });
    }
    return res.status(204).send();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

/**
 * PUT /aulas/:id
 * Actualiza nombre/grado/seccion
 */
router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { nombre, grado, seccion } = req.body;

  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "VALIDATION_ERROR", message: "ID inválido" });
  }
  if (!nombre || !grado || !seccion) {
    return res
      .status(400)
      .json({ error: "VALIDATION_ERROR", message: "Faltan campos: nombre, grado, seccion" });
  }

  try {
    const db = await openDb();
    const existe = await db.get("SELECT id FROM aulas WHERE id = ?", [id]);
    if (!existe) return res.status(404).json({ error: "NOT_FOUND", message: "Aula no encontrada" });

    await db.run("UPDATE aulas SET nombre = ?, grado = ?, seccion = ? WHERE id = ?", [
      nombre,
      grado,
      seccion,
      id,
    ]);
    return res.json({ id, nombre, grado, seccion });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

/**
 * GET /aulas/:aulaId/estudiantes
 * Lista estudiantes de un aula
 */
router.get("/:aulaId/estudiantes", async (req, res) => {
  const { aulaId } = req.params;
  try {
    const db = await openDb();
    const rows = await db.all(
      `
      SELECT e.id, e.nombre
      FROM estudiantes_aulas ea
      JOIN estudiantes e ON e.id = ea.estudiante_id
      WHERE ea.aula_id = ?
      ORDER BY e.nombre
      `,
      [aulaId]
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "INTERNAL_ERROR" });
  }
});

/**
 * POST /aulas/:aulaId/estudiantes/bulk
 * Registra varios estudiantes por salto de línea
 * body: { lista: "Nombre 1\nNombre 2\n..." }
 */
router.post("/:aulaId/estudiantes/bulk", async (req, res) => {
  const { aulaId } = req.params;
  const { lista } = req.body;

  if (!lista?.trim()) return res.status(400).json({ message: "EMPTY_LIST" });

  const nombres = lista
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (nombres.length === 0) return res.status(400).json({ message: "EMPTY_LIST" });

  const db = await openDb();
  await db.exec("BEGIN");
  try {
    let inserted = 0;
    for (const nombre of nombres) {
      let est = await db.get(`SELECT id FROM estudiantes WHERE nombre = ?`, [nombre]);
      if (!est) {
        const r = await db.run(`INSERT INTO estudiantes (nombre) VALUES (?)`, [nombre]);
        est = { id: r.lastID };
      }
      await db.run(
        `INSERT OR IGNORE INTO estudiantes_aulas (estudiante_id, aula_id) VALUES (?, ?)`,
        [est.id, aulaId]
      );
      inserted++;
    }
    await db.exec("COMMIT");
    res.json({ inserted });
  } catch (e) {
    console.error(e);
    try { await db.exec("ROLLBACK"); } catch {}
    res.status(500).json({ message: "INTERNAL_ERROR" });
  }
});

export default router;
