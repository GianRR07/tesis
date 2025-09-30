import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./Ventanas/Login";
import OpcionesCoordinador from "./Ventanas/Coordinador/Opciones-Coordinador";
import GestionarAula from "./Ventanas/Coordinador/GestionarAula";
import RegistrarCurso from "./Ventanas/Coordinador/RegistrarCurso";
import RegistrarDocente from "./Ventanas/Coordinador/RegistrarDocente";
import AsignarTutor from "./Ventanas/Coordinador/AsignarTutor";
import ListaAulas from "./Ventanas/Coordinador/ListaAulas";
import ListaDocentes from "./Ventanas/Coordinador/ListaDocentes";

function App() {
  return (
    <Router>
      <Routes>
        {/* Pantalla principal de login */}
        <Route path="/" element={<Login />} />

        {/* Opciones del coordinador con subrutas */}
        <Route path="/coordinador" element={<OpcionesCoordinador />}>
          <Route index element={<div style={{ opacity: 0.3 }}>LOGO EVALUATEPE</div>} />
          <Route path="aulas" element={<GestionarAula />} />
          <Route path="registrar-curso" element={<RegistrarCurso />} />
          <Route path="registrar-docente" element={<RegistrarDocente />} />
          <Route path="asignar-tutor" element={<AsignarTutor />} />
          <Route path="lista-aulas" element={<ListaAulas />} />
          <Route path="lista-docentes" element={<ListaDocentes />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;   
