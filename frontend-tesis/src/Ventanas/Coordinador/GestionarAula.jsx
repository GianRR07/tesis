import React, { useState } from "react";

export default function GestionarAula() {
  const [nombre, setNombre] = useState("");
  const [grado, setGrado] = useState("");
  const [seccion, setSeccion] = useState("");
  const [curso, setCurso] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Datos del aula:", { nombre, grado, seccion, curso });
    alert("Aula registrada (simulado, falta backend).");
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-700">Registro de aulas</h2>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Columna izquierda */}
        <div className="space-y-4">
          <label className="block">
            <span className="font-medium">Nombre de aula:</span>
            <input
              type="text"
              placeholder="Ejem: Salón 1° primaria - A"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="mt-1 w-full p-2 border rounded-md focus:ring focus:ring-blue-300"
            />
          </label>

          <label className="block">
            <span className="font-medium">Grado:</span>
            <input
              type="text"
              placeholder="Ejem: 1° de primaria"
              value={grado}
              onChange={(e) => setGrado(e.target.value)}
              className="mt-1 w-full p-2 border rounded-md focus:ring focus:ring-blue-300"
            />
          </label>

          <label className="block">
            <span className="font-medium">Sección:</span>
            <input
              type="text"
              placeholder="Ejem: A"
              value={seccion}
              onChange={(e) => setSeccion(e.target.value)}
              className="mt-1 w-full p-2 border rounded-md focus:ring focus:ring-blue-300"
            />
          </label>
        </div>

        {/* Columna derecha */}
        <div className="space-y-4">
          <label className="block">
            <span className="font-medium">Cursos del aula:</span>
            <select
              value={curso}
              onChange={(e) => setCurso(e.target.value)}
              className="mt-1 w-full p-2 border rounded-md focus:ring focus:ring-blue-300"
            >
              <option value="">-- Seleccione un curso --</option>
              <option value="matematicas">Matemáticas</option>
              <option value="comunicacion">Comunicación</option>
              <option value="ciencias">Ciencias</option>
            </select>
          </label>
        </div>

        {/* Footer */}
        <div className="md:col-span-2 flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Registrar aula
          </button>
        </div>
      </form>
    </div>
  );
}
