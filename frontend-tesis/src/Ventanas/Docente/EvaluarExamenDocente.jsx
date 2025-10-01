import React, { useState } from "react";

export default function EvaluarExamenDocente() {
  const [salon, setSalon] = useState("");
  const [alumno, setAlumno] = useState("");
  const [examenBase, setExamenBase] = useState("");

  const salones = ["Aula 1", "Aula 2", "Aula 3"];
  const alumnos = ["Carlos Pérez", "María Gómez", "Ana Torres"];
  const examenes = ["Examen Matemáticas", "Examen Lengua", "Examen Historia"];

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-[#004d8f]">Evaluar Examen</h2>

      {/* Salón */}
      <div className="mb-4">
        <label className="block font-medium text-gray-700">
          Seleccione el salón:
        </label>
        <select
          className="mt-1 w-full p-2 border rounded-md focus:ring focus:ring-blue-300"
          value={salon}
          onChange={(e) => setSalon(e.target.value)}
        >
          <option value="">Seleccione un salón</option>
          {salones.map((s, i) => (
            <option key={i} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Alumno */}
      <div className="mb-4">
        <label className="block font-medium text-gray-700">
          Seleccione el alumno:
        </label>
        <select
          className="mt-1 w-full p-2 border rounded-md focus:ring focus:ring-blue-300"
          value={alumno}
          onChange={(e) => setAlumno(e.target.value)}
        >
          <option value="">Seleccione un alumno</option>
          {alumnos.map((a, i) => (
            <option key={i} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>

      {/* Examen */}
      <div className="mb-4">
        <label className="block font-medium text-gray-700">
          Seleccione el examen:
        </label>
        <select
          className="mt-1 w-full p-2 border rounded-md focus:ring focus:ring-blue-300"
          value={examenBase}
          onChange={(e) => setExamenBase(e.target.value)}
        >
          <option value="">Seleccione un examen</option>
          {examenes.map((ex, i) => (
            <option key={i} value={ex}>
              {ex}
            </option>
          ))}
        </select>
      </div>

      {/* Archivo */}
      <div className="mb-6">
        <label className="block font-medium text-gray-700">
          Cargar examen del alumno:
        </label>
        <input
          type="file"
          accept=".pdf,.png,.jpg"
          className="mt-1 w-full p-2 border rounded-md"
        />
      </div>

      {/* Botón */}
      <button className="w-full bg-[#004d8f] text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
        Realizar evaluación
      </button>
    </div>
  );
}
