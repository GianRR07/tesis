import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { openDb } from "../db.js";
import evaluarAutomaticoLLM from "../services/evaluador_llm.js";


const router = express.Router();

const uploadDir = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ts = Date.now();
    const safe = file.originalname.replace(/\s+/g, "_");
    cb(null, `${ts}_${safe}`);
  }
});
const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const ok = file.mimetype === "application/pdf";
    if (!ok) return cb(new Error("Solo se permite PDF"));
    cb(null, true);
  },
});



router.post("/", upload.single("archivo_resuelto"), async (req, res) => {
  try {
    const examen_id = Number(req.body?.examen_id);
    const estudiante_id = Number(req.body?.estudiante_id);
    const docente_id = Number(req.body?.docente_id); 

    
    if (!Number.isInteger(examen_id) || !Number.isInteger(estudiante_id) || !Number.isInteger(docente_id)) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: "VALIDATION_ERROR", message: "examen_id, estudiante_id y docente_id requeridos" });
    }
    if (!req.file) {
      return res.status(400).json({ error: "VALIDATION_ERROR", message: "archivo_resuelto (PDF) es requerido" });
    }

    const db = await openDb();

    
    const ex = await db.get("SELECT id FROM examenes WHERE id = ?", [examen_id]);
    if (!ex) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: "VALIDATION_ERROR", message: "examen_id no existe" });
    }
    const est = await db.get("SELECT id FROM estudiantes WHERE id = ?", [estudiante_id]);
    if (!est) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: "VALIDATION_ERROR", message: "estudiante_id no existe" });
    }
    const doc = await db.get("SELECT id FROM docentes WHERE id = ?", [docente_id]);
    if (!doc) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: "VALIDATION_ERROR", message: "docente_id no existe" });
    }

    

let r;

if (req.body.tutor_id) {
  const tutor_id = Number(req.body.tutor_id);

  r = await db.run(
    `INSERT INTO evaluaciones (estudiante_id, examen_id, tutor_id, nota, archivo_resuelto)
     VALUES (?, ?, ?, NULL, ?)`,
    [
      estudiante_id,
      examen_id,
      tutor_id,
      path.join("uploads", path.basename(req.file.path))
    ]
  );

  console.log(`🟢 Evaluación creada por tutor ${tutor_id}`);
} else {
  r = await db.run(
    `INSERT INTO evaluaciones (estudiante_id, examen_id, docente_id, nota, archivo_resuelto)
     VALUES (?, ?, ?, NULL, ?)`,
    [
      estudiante_id,
      examen_id,
      docente_id,
      path.join("uploads", path.basename(req.file.path))
    ]
  );

  console.log(`🟢 Evaluación creada por docente ${docente_id}`);
}

return res.status(201).json({ id: r.lastID, nota: null });


  } catch (err) {
    console.error(err);
    try { if (req.file) fs.unlinkSync(req.file.path); } catch {}
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});


router.post("/:id/auto", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "VALIDATION_ERROR", message: "id inválido" });
    }

    
    const out = await evaluarAutomaticoLLM(id);

    
    

    const db = await openDb();

    
    await db.run(
      `UPDATE evaluaciones SET nota = ?, veredicto = ? WHERE id = ?`,
      [out.nota ?? null, out.veredicto ?? null, id]
    );

    console.log(`🧠 Evaluación ${id} actualizada con nota/veredicto.`);
    return res.json(out);
  } catch (err) {
    console.error(err);
    return res.status(400).json({ error: "EVALUATION_ERROR", message: err.message });
  }
});





router.get("/metricas/estudiantes", async (req, res) => {
  try {
    const db = await openDb();
    const result = await db.all(`
      SELECT 
        e.id AS estudiante_id,
        e.nombre AS estudiante,
        ROUND(AVG(ev.nota), 2) AS promedio_general
      FROM estudiantes e
      JOIN evaluaciones ev ON e.id = ev.estudiante_id
      GROUP BY e.id
      ORDER BY promedio_general DESC
    `);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DB_ERROR", message: err.message });
  }
});


router.get("/metricas/curso", async (req, res) => {
  try {
    const db = await openDb();
    const result = await db.all(`
      SELECT 
        e.id AS estudiante_id,
        e.nombre AS estudiante,
        c.nombre AS curso,
        ROUND(AVG(ev.nota), 2) AS promedio_curso
      FROM evaluaciones ev
      JOIN examenes ex ON ev.examen_id = ex.id
      JOIN cursos c ON ex.curso_id = c.id
      JOIN estudiantes e ON ev.estudiante_id = e.id
      GROUP BY e.id, c.id
      ORDER BY e.nombre, c.nombre
    `);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DB_ERROR", message: err.message });
  }
});


router.get("/metricas/aulas", async (req, res) => {
  try {
    const db = await openDb();
    const result = await db.all(`
      SELECT 
        a.nombre AS aula,
        ROUND(AVG(ev.nota), 2) AS promedio_aula
      FROM evaluaciones ev
      JOIN estudiantes e ON ev.estudiante_id = e.id
      JOIN estudiantes_aulas ea ON e.id = ea.estudiante_id
      JOIN aulas a ON ea.aula_id = a.id
      GROUP BY a.id
    `);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DB_ERROR", message: err.message });
  }
});



router.get("/resultados", async (req, res) => {
  try {
    const docenteId = Number(req.query.docenteId);
    const aulaId = Number(req.query.aulaId);

    if (!Number.isInteger(docenteId) || !Number.isInteger(aulaId)) {
      return res.status(400).json({ error: "VALIDATION_ERROR", message: "docenteId y aulaId requeridos" });
    }

    const db = await openDb();

    
    const evals = await db.all(`
      SELECT
        ev.id                 AS evaluacion_id,
        ev.estudiante_id,
        ev.nota,
        ev.veredicto,
        ex.nombre             AS examen_nombre,
        c.nombre              AS curso_nombre
      FROM evaluaciones ev
      JOIN examenes  ex  ON ev.examen_id = ex.id
      JOIN cursos    c   ON ex.curso_id  = c.id
      JOIN estudiantes e ON ev.estudiante_id = e.id
      JOIN estudiantes_aulas ea ON e.id = ea.estudiante_id
      WHERE ev.docente_id = ?
        AND ea.aula_id     = ?
      ORDER BY e.id, ex.id, ev.id
    `, [docenteId, aulaId]);

    if (evals.length === 0) return res.json([]);

    
    const ids = evals.map(r => r.evaluacion_id);
    const placeholders = ids.map(() => '?').join(',');
    const detallesRows = await db.all(
      `
      SELECT ed.evaluacion_id, ed.resumen_json
      FROM evaluacion_detalles ed
      JOIN (
        SELECT evaluacion_id, MAX(id) AS max_id
        FROM evaluacion_detalles
        WHERE evaluacion_id IN (${placeholders})
        GROUP BY evaluacion_id
      ) t ON t.evaluacion_id = ed.evaluacion_id AND t.max_id = ed.id
      `,
      ids
    );

    const mapDetalle = new Map(detallesRows.map(r => [r.evaluacion_id, r.resumen_json]));

    
    const out = evals.map(r => {
      const raw = mapDetalle.get(r.evaluacion_id);
      let total_correctas = 0, total_parciales = 0, total_incorrectas = 0;
      const preguntas_correctas = [];
      const preguntas_parciales = [];
      const preguntas_marcadas = []; 

      if (raw) {
        try {
          const det = JSON.parse(raw);
          const valor = Number(det?.valorPregunta ?? 0);
          const preguntas = Array.isArray(det?.preguntas) ? det.preguntas : [];

          for (const p of preguntas) {
            const num = Number(p?.numero);
            const puntaje = Number(p?.puntaje ?? 0); 
            
            if (puntaje >= 1 - 1e-6) {
              total_correctas += 1;
              if (Number.isInteger(num)) preguntas_correctas.push(num);
            } else if (puntaje > 0) {
              total_parciales += 1;
              if (Number.isInteger(num)) preguntas_parciales.push(num);
            } else {
              total_incorrectas += 1;
            }

            
            if (Number.isInteger(num)) {
              const marcado = (p?.alumno ?? "").toString().trim();
              if (marcado.length) preguntas_marcadas.push({ numero: num, marcado });
            }
          }
        } catch (_e) {
          
        }
      }

      return {
        estudiante_id: r.estudiante_id,
        examen_nombre: r.examen_nombre,
        curso_nombre: r.curso_nombre,
        nota: r.nota,
        veredicto: r.veredicto ?? null,

        
        total_correctas,
        total_parciales,
        total_incorrectas,
        preguntas_correctas,
        preguntas_parciales,
        preguntas_marcadas,
        
      };
    });

    return res.json(out);
  } catch (err) {
    console.error("ERROR /evaluaciones/resultados:", err);
    return res.status(500).json({ error: "DB_ERROR", message: err.message });
  }
});



router.get("/resultados/tutor", async (req, res) => {
  try {
    const tutorId = Number(req.query.tutorId);
    const aulaId = Number(req.query.aulaId);

    if (!Number.isInteger(tutorId) || !Number.isInteger(aulaId)) {
      return res.status(400).json({
        error: "VALIDATION_ERROR",
        message: "tutorId y aulaId requeridos"
      });
    }

    const db = await openDb();

    
    const evals = await db.all(`
      SELECT
        ev.id                 AS evaluacion_id,
        ev.estudiante_id,
        ev.nota,
        ev.veredicto,
        ex.nombre             AS examen_nombre,
        c.nombre              AS curso_nombre
      FROM evaluaciones ev
      JOIN examenes  ex  ON ev.examen_id = ex.id
      JOIN cursos    c   ON ex.curso_id  = c.id
      JOIN estudiantes e ON ev.estudiante_id = e.id
      JOIN estudiantes_aulas ea ON e.id = ea.estudiante_id
      WHERE ev.tutor_id = ?
        AND ea.aula_id   = ?
      ORDER BY e.id, ex.id, ev.id
    `, [tutorId, aulaId]);

    if (evals.length === 0) return res.json([]);

    
    const ids = evals.map(r => r.evaluacion_id);
    const placeholders = ids.map(() => "?").join(",");
    const detallesRows = await db.all(`
      SELECT ed.evaluacion_id, ed.resumen_json
      FROM evaluacion_detalles ed
      JOIN (
        SELECT evaluacion_id, MAX(id) AS max_id
        FROM evaluacion_detalles
        WHERE evaluacion_id IN (${placeholders})
        GROUP BY evaluacion_id
      ) t ON t.evaluacion_id = ed.evaluacion_id AND t.max_id = ed.id
    `, ids);

    const mapDetalle = new Map(
      detallesRows.map(r => [r.evaluacion_id, r.resumen_json])
    );

    
    const out = evals.map(r => {
      const raw = mapDetalle.get(r.evaluacion_id);
      let total_correctas = 0,
        total_parciales = 0,
        total_incorrectas = 0;

      const preguntas_correctas = [];
      const preguntas_parciales = [];
      const preguntas_marcadas = [];

      if (raw) {
        try {
          const det = JSON.parse(raw);
          const preguntas = Array.isArray(det?.preguntas) ? det.preguntas : [];

          for (const p of preguntas) {
            const num = Number(p?.numero);
            const puntaje = Number(p?.puntaje ?? 0);

            if (puntaje >= 1) {
              total_correctas++;
              preguntas_correctas.push(num);
            } else if (puntaje > 0) {
              total_parciales++;
              preguntas_parciales.push(num);
            } else {
              total_incorrectas++;
            }

            const marcado = (p?.alumno ?? "").toString().trim();
            if (marcado.length) preguntas_marcadas.push({ numero: num, marcado });
          }
        } catch (_) {}
      }

      return {
        estudiante_id: r.estudiante_id,
        examen_nombre: r.examen_nombre,
        curso_nombre: r.curso_nombre,
        nota: r.nota,
        veredicto: r.veredicto ?? null,

        total_correctas,
        total_parciales,
        total_incorrectas,
        preguntas_correctas,
        preguntas_parciales,
        preguntas_marcadas
      };
    });

    return res.json(out);
  } catch (err) {
    console.error("ERROR /evaluaciones/resultados/tutor:", err);
    return res.status(500).json({ error: "DB_ERROR", message: err.message });
  }
});

router.get("/resultados/tutor/por-curso", async (req, res) => {
  try {
    const tutorId = Number(req.query.tutorId);
    const aulaId = Number(req.query.aulaId);

    if (!Number.isInteger(tutorId) || !Number.isInteger(aulaId)) {
      return res.status(400).json({
        error: "VALIDATION_ERROR",
        message: "tutorId y aulaId requeridos"
      });
    }

    const db = await openDb();

    const rows = await db.all(`
      SELECT
        c.nombre AS curso_nombre,
        ex.nombre AS examen_nombre,
        e.id AS estudiante_id,
        ev.nota,
        ev.veredicto
      FROM evaluaciones ev
      JOIN examenes ex        ON ev.examen_id = ex.id
      JOIN cursos c           ON ex.curso_id = c.id
      JOIN estudiantes e      ON ev.estudiante_id = e.id
      JOIN estudiantes_aulas ea ON e.id = ea.estudiante_id
      WHERE ev.tutor_id = ?
        AND ea.aula_id = ?
      ORDER BY c.nombre, e.id, ex.id
    `, [tutorId, aulaId]);

    if (rows.length === 0) return res.json({});

    const resultado = {};

    rows.forEach(r => {
      if (!resultado[r.curso_nombre]) resultado[r.curso_nombre] = {};
      if (!resultado[r.curso_nombre][r.estudiante_id]) {
        resultado[r.curso_nombre][r.estudiante_id] = { examenes: [], sumaNotas: 0, cantidad: 0 };
      }

      const alumno = resultado[r.curso_nombre][r.estudiante_id];
      alumno.examenes.push({
        nombre: r.examen_nombre,
        nota: r.nota,
        veredicto: r.veredicto
      });
      alumno.sumaNotas += r.nota;
      alumno.cantidad++;
    });

    
    for (const curso in resultado) {
      for (const estudianteId in resultado[curso]) {
        const alumno = resultado[curso][estudianteId];
        alumno.promedio = Number((alumno.sumaNotas / alumno.cantidad).toFixed(2));
        delete alumno.sumaNotas;
        delete alumno.cantidad;
      }
    }

    return res.json(resultado);

  } catch (err) {
    console.error("ERROR /resultados/tutor/por-curso:", err);
    return res.status(500).json({ error: "DB_ERROR", message: err.message });
  }
});

router.get("/resultados/tutor/por-curso-detalle", async (req, res) => {
  try {
    const tutorId = Number(req.query.tutorId);
    const aulaId = Number(req.query.aulaId);

    if (!Number.isInteger(tutorId) || !Number.isInteger(aulaId)) {
      return res.status(400).json({
        error: "VALIDATION_ERROR",
        message: "tutorId y aulaId requeridos"
      });
    }

    const db = await openDb();

    
    const rows = await db.all(`
      SELECT
        c.nombre AS curso_nombre,
        ex.nombre AS examen_nombre,
        e.id AS estudiante_id,
        ev.nota,
        ev.veredicto
      FROM evaluaciones ev
      JOIN examenes ex        ON ev.examen_id = ex.id
      JOIN cursos c           ON ex.curso_id = c.id
      JOIN estudiantes e      ON ev.estudiante_id = e.id
      JOIN estudiantes_aulas ea ON e.id = ea.estudiante_id
      WHERE ev.tutor_id = ?
        AND ea.aula_id = ?
      ORDER BY c.nombre, e.id, ex.id
    `, [tutorId, aulaId]);

    if (rows.length === 0) return res.json({});

    
    const resultado = {};

    rows.forEach(r => {
      if (!resultado[r.curso_nombre]) resultado[r.curso_nombre] = {};
      if (!resultado[r.curso_nombre][r.estudiante_id]) {
        resultado[r.curso_nombre][r.estudiante_id] = { examenes: [] };
      }

      resultado[r.curso_nombre][r.estudiante_id].examenes.push({
        nombre: r.examen_nombre,
        nota: r.nota,
        veredicto: r.veredicto
      });
    });

    return res.json(resultado);

  } catch (err) {
    console.error("ERROR /resultados/tutor/por-curso-detalle:", err);
    return res.status(500).json({ error: "DB_ERROR", message: err.message });
  }
});





export default router;

