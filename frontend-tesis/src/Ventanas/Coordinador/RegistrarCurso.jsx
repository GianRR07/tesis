import React, { useState } from "react";

export default function RegistrarCurso() {
  const [nombreCurso, setNombreCurso] = useState("");
  const [docente, setDocente] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Datos del curso:", { nombreCurso, docente });
    alert("Curso registrado (simulado, falta backend).");
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-[#004d8f]">
        Registro de Curso
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nombre del curso */}
        <div>
          <label className="block font-medium text-gray-700">
            Nombre del curso:
          </label>
          <input
            type="text"
            placeholder="Ej: Matemáticas"
            value={nombreCurso}
            onChange={(e) => setNombreCurso(e.target.value)}
            className="mt-1 w-full p-2 border rounded-md focus:ring focus:ring-blue-300"
          />
        </div>

        {/* Selección de docente */}
        <div>
          <label className="block font-medium text-gray-700">Docente:</label>
          <select
            value={docente}
            onChange={(e) => setDocente(e.target.value)}
            className="mt-1 w-full p-2 border rounded-md focus:ring focus:ring-blue-300"
          >
            <option value="">-- Seleccione un docente --</option>
            <option value="luis_cabrera">Luis Cabrera</option>
            <option value="ana_garcia">Ana García</option>
            <option value="juan_perez">Juan Pérez</option>
          </select>
        </div>

        {/* Botón */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 bg-[#004d8f] text-white rounded-lg hover:bg-blue-700 transition"
          >
            Registrar Curso
          </button>
        </div>
      </form>
    </div>
  );
}
