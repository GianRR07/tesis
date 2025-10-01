import React from "react";
import { FaChartLine } from "react-icons/fa";

export default function ListaEstudiantes() {
  const estudiantes = [
    "Valentina Ramírez Torres",
    "Diego Fernández López",
    "Camila Soto Martínez",
    "Luis Alberto Gutiérrez",
    "María Fernanda Díaz",
    "Andrés Felipe Morales",
  ];

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-2xl font-bold text-[#004d8f] mb-4">
        Lista de estudiantes
      </h2>

      <table className="w-full border border-gray-300 rounded-lg overflow-hidden">
        <thead className="bg-[#004d8f] text-white">
          <tr>
            <th className="p-2 text-left">Nombre</th>
            <th className="p-2 text-left">Opciones</th>
          </tr>
        </thead>
        <tbody>
          {estudiantes.map((est, i) => (
            <tr
              key={i}
              className="border-b hover:bg-gray-100 transition cursor-pointer"
            >
              <td className="p-2">{est}</td>
              <td className="p-2">
                <button className="flex items-center gap-2 bg-[#004d8f] text-white px-3 py-1 rounded-full hover:bg-blue-900 transition">
                  <FaChartLine /> Ver métricas de rendimiento
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
