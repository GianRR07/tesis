// backend-tesis/routes/auth.js
import express from "express";
import bcrypt from "bcryptjs";
import { openDb } from "../db.js";

const router = express.Router();

/**
 * POST /auth/login
 * body: { email, password }
 * - Si email=coordinador@edu.pe y password=soyadmin => coordinador
 * - Si coincide con docente (correo_ingreso + password_hash) =>
 *   devuelve roles: aulas donde enseña (docente) y aulas donde es tutor (si tiene registro en tutores).
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "VALIDATION_ERROR", message: "email y password son requeridos" });
    }

    // 1) Coordinador “fijo”
    if (email === "coordinador@edu.pe" && password === "soyadmin") {
      return res.json({
        userType: "coordinador",
        coordinador: { email: "coordinador@edu.pe", nombre: "Coordinador" },
        roles: { coordinador: true },
      });
    }

    const db = await openDb();

    // 2) Buscar DOCENTE por correo_ingreso
    const docente = await db.get(
      `SELECT id, nombre, email, telefono, cursos_que_ensena, correo_ingreso, password_hash
       FROM docentes
       WHERE correo_ingreso = ?`,
      [email]
    );
    if (!docente) {
      return res.status(401).json({ error: "AUTH_ERROR", message: "Credenciales inválidas" });
    }

    const ok = await bcrypt.compare(password, docente.password_hash);
    if (!ok) {
      return res.status(401).json({ error: "AUTH_ERROR", message: "Credenciales inválidas" });
    }

    // 3) AULAS donde es DOCENTE (enseña algún curso del aula)
    const aulasDocente = await db.all(
      `
      SELECT a.id, a.nombre, a.grado, a.seccion
      FROM aulas_cursos ac
      JOIN aulas a ON a.id = ac.aula_id
      WHERE ac.docente_id = ?
      GROUP BY a.id
      ORDER BY a.grado, a.seccion
      `,
      [docente.id]
    );

    // 4) AULAS donde es TUTOR (si existe un registro en TUTORES con MISMO EMAIL)
    //    (si no existe, devolveremos lista vacía)
    const tutor = await db.get(
      `SELECT id FROM tutores WHERE email = ?`,
      [docente.email]
    );

    let aulasTutor = [];
    if (tutor?.id) {
      aulasTutor = await db.all(
        `
        SELECT a.id, a.nombre, a.grado, a.seccion
        FROM aula_tutores at
        JOIN aulas a ON a.id = at.aula_id
        WHERE at.tutor_id = ?
        ORDER BY a.grado, a.seccion
        `,
        [tutor.id]
      );
    }

    const roles = {
      docente: { aulas: aulasDocente }, // []
      tutor: { aulas: aulasTutor },     // []
    };

    return res.json({
      userType: "docente",
      docente: {
        id: docente.id,
        nombre: docente.nombre,
        email: docente.email,
        telefono: docente.telefono,
        correo_ingreso: docente.correo_ingreso,
      },
      roles,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

export default router;
