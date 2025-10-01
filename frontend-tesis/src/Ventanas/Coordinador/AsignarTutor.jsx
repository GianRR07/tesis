import React, { useState } from "react";

export default function AsignarTutor() {
  // Datos simulados
  const aulasMock = [
    { id: 1, nombre: "1° Primaria - A", grado: "1°", seccion: "A" },
    { id: 2, nombre: "2° Primaria - B", grado: "2°", seccion: "B" },
  ];

  const docentesMock = [
    { id: 1, nombre: "Luis Cabrera" },
    { id: 2, nombre: "Ana Torres" },
    { id: 3, nombre: "Miguel Fonsi" },
  ];

  const [aulaSeleccionada, setAulaSeleccionada] = useState(null);
  const [docenteSeleccionado, setDocenteSeleccionado] = useState(null);

  const handleAsignar = () => {
    if (!aulaSeleccionada || !docenteSeleccionado) {
      alert("Debe seleccionar un aula y un docente.");
      return;
    }

    alert(
      `Tutor asignado:\n${docenteSeleccionado.nombre} → ${aulaSeleccionada.nombre}`
    );
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-700">Asignar Tutor</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Lista de aulas */}
        <div className="border rounded-lg p-4 shadow-sm">
          <h3 className="text-lg font-semibold mb-2">Aulas</h3>
          <table className="w-full border-collapse border border-gray-300 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 px-2 py-1">Nombre</th>
                <th className="border border-gray-300 px-2 py-1">Grado</th>
                <th className="border border-gray-300 px-2 py-1">Sección</th>
              </tr>
            </thead>
            <tbody>
              {aulasMock.map((aula) => (
                <tr
                  key={aula.id}
                  className={`cursor-pointer hover:bg-blue-100 ${
                    aulaSeleccionada?.id === aula.id ? "bg-blue-200" : ""
                  }`}
                  onClick={() => setAulaSeleccionada(aula)}
                >
                  <td className="border border-gray-300 px-2 py-1">{aula.nombre}</td>
                  <td className="border border-gray-300 px-2 py-1">{aula.grado}</td>
                  <td className="border border-gray-300 px-2 py-1">{aula.seccion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Lista de docentes */}
        <div className="border rounded-lg p-4 shadow-sm">
          <h3 className="text-lg font-semibold mb-2">Docentes</h3>
          <ul className="space-y-2">
            {docentesMock.map((doc) => (
              <li
                key={doc.id}
                className={`cursor-pointer px-3 py-2 rounded-md border ${
                  docenteSeleccionado?.id === doc.id
                    ? "bg-green-200 border-green-500"
                    : "hover:bg-green-100"
                }`}
                onClick={() => setDocenteSeleccionado(doc)}
              >
                {doc.nombre}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Botón Asignar */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleAsignar}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Asignar Tutor
        </button>
      </div>
    </div>
  );
}
