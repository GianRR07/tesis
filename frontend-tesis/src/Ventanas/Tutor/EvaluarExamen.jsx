import React, { useState } from "react";

export default function EvaluarExamen() {
  const [alumno, setAlumno] = useState("");
  const [examenBase, setExamenBase] = useState("");
  const [archivoAlumno, setArchivoAlumno] = useState(null);

  const alumnos = ["Valentina Ramírez", "Diego Fernández", "Camila Soto"];
  const examenes = ["Examen Matemáticas", "Examen Comunicación", "Examen Biología"];

  const handleFileChange = (e) => {
    setArchivoAlumno(e.target.files[0]);
  };

  const handleEvaluar = () => {
    if (!alumno || !examenBase || !archivoAlumno) {
      alert("Debe seleccionar un alumno, un examen base y cargar un archivo.");
      return;
    }
    alert(
      `Evaluando a ${alumno} con el examen base "${examenBase}". Archivo: ${archivoAlumno.name}`
    );
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-[#004d8f] mb-4">Evaluar Examen</h2>

      {/* Selección de alumno */}
      <label className="block font-medium text-gray-700 mb-2">
        Seleccione al alumno que se evaluará:
      </label>
      <select
        value={alumno}
        onChange={(e) => setAlumno(e.target.value)}
        className="w-full border border-gray-300 rounded-lg p-2 mb-4 focus:ring-2 focus:ring-[#004d8f]"
      >
        <option value="">-- Seleccione un alumno --</option>
        {alumnos.map((a, index) => (
          <option key={index} value={a}>
            {a}
          </option>
        ))}
      </select>

      {/* Selección de examen base */}
      <label className="block font-medium text-gray-700 mb-2">
        Seleccione el examen base:
      </label>
      <select
        value={examenBase}
        onChange={(e) => setExamenBase(e.target.value)}
        className="w-full border border-gray-300 rounded-lg p-2 mb-4 focus:ring-2 focus:ring-[#004d8f]"
      >
        <option value="">-- Seleccione un examen --</option>
        {examenes.map((ex, index) => (
          <option key={index} value={ex}>
            {ex}
          </option>
        ))}
      </select>

      {/* Subida del examen del alumno */}
      <label className="block font-medium text-gray-700 mb-2">
        Cargue el examen del alumno:
      </label>
      <input
        type="file"
        accept=".pdf,image/*"
        onChange={handleFileChange}
        className="block w-full border border-gray-300 rounded-lg p-2 mb-6"
      />

      {/* Botón de evaluar */}
      <div className="text-center">
        <button
          onClick={handleEvaluar}
          className="bg-[#004d8f] text-white px-6 py-2 rounded-full font-semibold hover:bg-blue-900 transition"
        >
          Realizar evaluación
        </button>
      </div>
    </div>
  );
}
