import express from "express";
import { openDb } from "../db.js";

const router = express.Router();

// Listar aulas (incluye tutores y cursos del aula)
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
      // Tutores
      const tutores = await db.all(`
        SELECT d.id, d.nombre
        FROM aula_tutores at
        JOIN docentes d ON d.id = at.docente_id
        WHERE at.aula_id = ?
        ORDER BY d.nombre ASC
      `, [aula.id]);
      aula.tutores = tutores; // [{id, nombre}]

      // Cursos del aula (con docente asignado al curso, si existe)
      const cursos = await db.all(`
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
      `, [aula.id]);
      aula.cursos = cursos; // [{id, nombre, docente_id, docente_nombre}]
    }

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
    if (db) { try { await db.exec("ROLLBACK"); } catch { } }
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// Listar tutores de un aula
router.get("/:aulaId/tutores", async (req, res) => {
  try {
    const aulaId = Number(req.params.aulaId);
    if (!Number.isInteger(aulaId)) {
      return res.status(400).json({ error: "VALIDATION_ERROR", message: "aulaId inválido" });
    }
    const db = await openDb();
    const tutores = await db.all(`
      SELECT d.id, d.nombre
      FROM aula_tutores at
      JOIN docentes d ON d.id = at.docente_id
      WHERE at.aula_id = ?
      ORDER BY d.nombre ASC
    `, [aulaId]);
    res.json(tutores);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// Asignar tutores a un aula (bulk); respeta máximo 2 tutores por aula
// body: { docentesIds: number[] }  --> se agregan, no reemplazan
router.post("/:aulaId/tutores", async (req, res) => {
  const aulaId = Number(req.params.aulaId);
  let { docentesIds } = req.body;

  if (!Number.isInteger(aulaId)) {
    return res.status(400).json({ error: "VALIDATION_ERROR", message: "aulaId inválido" });
  }
  if (!Array.isArray(docentesIds) || docentesIds.length === 0) {
    return res.status(400).json({ error: "VALIDATION_ERROR", message: "docentesIds es requerido (array)" });
  }
  const ids = docentesIds.map(n => Number(n)).filter(n => Number.isInteger(n) && n > 0);
  if (ids.length !== docentesIds.length) {
    return res.status(400).json({ error: "VALIDATION_ERROR", message: "Hay docente(s) con ID inválido" });
  }

  let db;
  try {
    db = await openDb();
    await db.exec("BEGIN");

    // Cuenta tutores actuales
    const actuales = await db.all("SELECT docente_id FROM aula_tutores WHERE aula_id = ?", [aulaId]);
    const yaAsignados = new Set(actuales.map(r => r.docente_id));

    // Evita duplicados y calcula cuántos nuevos entrarían
    const nuevos = ids.filter(id => !yaAsignados.has(id));
    const total = actuales.length + nuevos.length;
    if (total > 2) {
      throw new Error(`Máximo 2 tutores por aula. Ya hay ${actuales.length}, intentas agregar ${nuevos.length}.`);
    }

    // Valida existencia de docentes
    const placeholders = nuevos.map(() => "?").join(",");
    if (nuevos.length > 0) {
      const docentesValidos = await db.all(
        `SELECT id FROM docentes WHERE id IN (${placeholders})`,
        nuevos
      );
      if (docentesValidos.length !== nuevos.length) {
        throw new Error("Algún docente no existe");
      }
    }

    // Inserta
    for (const docId of nuevos) {
      await db.run(
        "INSERT INTO aula_tutores (aula_id, docente_id) VALUES (?, ?)",
        [aulaId, docId]
      );
    }

    await db.exec("COMMIT");
    return res.status(201).json({ message: "Tutores asignados", agregados: nuevos });
  } catch (err) {
    console.error(err);
    if (db) { try { await db.exec("ROLLBACK"); } catch { } }
    return res.status(400).json({ error: "VALIDATION_ERROR", message: err.message });
  }
});

// Quitar un tutor de un aula
router.delete("/:aulaId/tutores/:docenteId", async (req, res) => {
  const aulaId = Number(req.params.aulaId);
  const docenteId = Number(req.params.docenteId);
  if (!Number.isInteger(aulaId) || !Number.isInteger(docenteId)) {
    return res.status(400).json({ error: "VALIDATION_ERROR", message: "IDs inválidos" });
  }

  try {
    const db = await openDb();
    const r = await db.run(
      "DELETE FROM aula_tutores WHERE aula_id = ? AND docente_id = ?",
      [aulaId, docenteId]
    );
    if (r.changes === 0) {
      return res.status(404).json({ error: "NOT_FOUND", message: "No había asignación para eliminar" });
    }
    return res.status(204).send();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// Actualizar aula (nombre, grado, seccion)
router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { nombre, grado, seccion } = req.body;

  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "VALIDATION_ERROR", message: "ID inválido" });
  }
  if (!nombre || !grado || !seccion) {
    return res.status(400).json({ error: "VALIDATION_ERROR", message: "Faltan campos: nombre, grado, seccion" });
  }

  try {
    const db = await openDb();

    const existe = await db.get("SELECT id FROM aulas WHERE id = ?", [id]);
    if (!existe) {
      return res.status(404).json({ error: "NOT_FOUND", message: "Aula no encontrada" });
    }

    await db.run(
      "UPDATE aulas SET nombre = ?, grado = ?, seccion = ? WHERE id = ?",
      [nombre, grado, seccion, id]
    );

    return res.json({ id, nombre, grado, seccion });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});



export default router;
