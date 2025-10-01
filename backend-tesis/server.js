import express from "express";
import cors from "cors";

import docentesRoutes from "./routes/docentes.js";
import tutoresRoutes from "./routes/tutores.js";
import cursosRoutes from "./routes/cursos.js";
import aulasRoutes from "./routes/aulas.js";
import estudiantesRoutes from "./routes/estudiantes.js";
import examenesRoutes from "./routes/examenes.js";
import evaluacionesRoutes from "./routes/evaluaciones.js";

const app = express();
app.use(cors());
app.use(express.json());


app.use("/docentes", docentesRoutes);
app.use("/tutores", tutoresRoutes);
app.use("/cursos", cursosRoutes);
app.use("/aulas", aulasRoutes);
app.use("/estudiantes", estudiantesRoutes);
app.use("/examenes", examenesRoutes);
app.use("/evaluaciones", evaluacionesRoutes);

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});
