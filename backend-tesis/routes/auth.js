
import express from "express";
import bcrypt from "bcryptjs";
import { openDb } from "../db.js";

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({
        error: "VALIDATION_ERROR",
        message: "email y password son requeridos",
      });
    }

    
    if (email === "coordinador@edu.pe" && password === "soyadmin") {
      return res.json({
        userType: "coordinador",
        coordinador: { email: "coordinador@edu.pe", nombre: "Coordinador" },
        roles: { coordinador: true },
      });
    }

    const db = await openDb();

    
    const docente = await db.get(
      `SELECT id, nombre, email, telefono, cursos_que_ensena, correo_ingreso, password_hash
       FROM docentes
       WHERE correo_ingreso = ?`,
      [email]
    );
    if (!docente) {
      return res.status(401).json({
        error: "AUTH_ERROR",
        message: "Credenciales inválidas",
      });
    }

    const ok = await bcrypt.compare(password, docente.password_hash);
    if (!ok) {
      return res.status(401).json({
        error: "AUTH_ERROR",
        message: "Credenciales inválidas",
      });
    }

    
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

    
    const emailNorm = (docente.email || "").trim();
    const tutor = await db.get(
      `SELECT id, nombre, email FROM tutores WHERE LOWER(email) = LOWER(?)`,
      [emailNorm]
    );

    let aulasTutor = [];
    if (tutor) {
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
      docente: { id: docente.id, aulas: aulasDocente },
    };
    if (tutor) {
      roles.tutor = { id: tutor.id, aulas: aulasTutor };
    }

    
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
    return res
      .status(500)
      .json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

export default router;
