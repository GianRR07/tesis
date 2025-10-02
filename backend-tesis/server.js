// backend-tesis/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

import docentesRoutes from "./routes/docentes.js";
import tutoresRoutes from "./routes/tutores.js";
import cursosRoutes from "./routes/cursos.js";
import aulasRoutes from "./routes/aulas.js";
import estudiantesRoutes from "./routes/estudiantes.js";
import examenesRoutes from "./routes/examenes.js";
import evaluacionesRoutes from "./routes/evaluaciones.js";

import { migrateIfNeeded } from "./migrate.js";

const app = express();

const PORT = process.env.PORT || 4000;
const ORIGIN = process.env.ORIGIN || "http://localhost:5173";

app.use(cors({ origin: ORIGIN, credentials: true }));
app.use(express.json());

app.use("/docentes", docentesRoutes);
app.use("/tutores", tutoresRoutes);
app.use("/cursos", cursosRoutes);
app.use("/aulas", aulasRoutes);
app.use("/estudiantes", estudiantesRoutes);
app.use("/examenes", examenesRoutes);
app.use("/evaluaciones", evaluacionesRoutes);

// Arranque con migración automática
async function start() {
  await migrateIfNeeded(); // crea/actualiza database.db si hace falta ejecutando schema.sql
  app.listen(PORT, () => {
    console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error("Error al iniciar el servidor:", err);
  process.exit(1);
});
