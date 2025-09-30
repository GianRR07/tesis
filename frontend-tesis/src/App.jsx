import React from "react";
import { Routes, Route } from "react-router-dom";

import Login from "./Ventanas/Login";
import OpcionesCoordinador from "./Ventanas/Coordinador/Opciones-Coordinador";
import OpcionesTutor from "./Ventanas/Tutor/Opciones-Tutor";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/coordinador" element={<OpcionesCoordinador />} />
      <Route path="/tutor" element={<OpcionesTutor />} />
    </Routes>
  );
}

export default App;
