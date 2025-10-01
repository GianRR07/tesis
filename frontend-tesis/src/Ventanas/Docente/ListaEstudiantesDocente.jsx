import React, { useState } from "react";
import { FaChartLine } from "react-icons/fa";

export default function ListaEstudiantesDocente() {
  const aulas = ["Aula 1", "Aula 2", "Aula 3"];

  const estudiantesPorAula = {
    "Aula 1": ["Carlos Pérez", "María Gómez", "Ana Torres"],
    "Aula 2": ["Luis Fernández", "Sofía Ríos", "Miguel Castro"],
    "Aula 3": ["Laura Ramírez", "Pedro López", "Valeria Sánchez"],
  };

  const [aulaSeleccionada, setAulaSeleccionada] = useState("");
  const estudiantes = aulaSeleccionada
    ? estudiantesPorAula[aulaSeleccionada]
    : [];

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-[#004d8f]">
        Lista de estudiantes
      </h2>

      {/* Selector de aula */}
      <div className="mb-4">
        <label className="block font-medium text-gray-700">Nombre del Aula:</label>
        <select
          value={aulaSeleccionada}
          onChange={(e) => setAulaSeleccionada(e.target.value)}
          className="mt-1 w-full p-2 border rounded-md focus:ring focus:ring-blue-300"
        >
          <option value="">Seleccione un aula</option>
          {aulas.map((aula, index) => (
            <option key={index} value={aula}>
              {aula}
            </option>
          ))}
        </select>
      </div>

      {/* Tabla */}
      {aulaSeleccionada && (
        <div className="overflow-x-auto">
          <table className="w-full border border-gray-300 rounded-md">
            <thead className="bg-[#004d8f] text-white">
              <tr>
                <th className="p-2 text-left">Nombre</th>
                <th className="p-2">Opciones</th>
              </tr>
            </thead>
            <tbody>
              {estudiantes.map((est, index) => (
                <tr key={index} className="border-t">
                  <td className="p-2">{est}</td>
                  <td className="p-2 text-center">
                    <button className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-[#004d8f] rounded hover:bg-blue-200">
                      <FaChartLine /> Ver métricas
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
