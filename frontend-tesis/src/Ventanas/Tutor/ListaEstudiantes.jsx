import React, { useEffect, useState } from "react";
import { FaChartLine } from "react-icons/fa";
import { getTutorAulaIdPreferida } from "../../utils/session";

export default function ListaEstudiantes() {
  const [estudiantes, setEstudiantes] = useState([]);
  const [err, setErr] = useState("");
  const aulaId = getTutorAulaIdPreferida();

  useEffect(() => {
    async function cargar() {
      setErr("");
      if (!aulaId) {
        setErr("No se pudo identificar el aula asignada al tutor.");
        return;
      }
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/aulas/${aulaId}/estudiantes`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "No se pudo cargar estudiantes.");
        setEstudiantes(data);
      } catch (e) {
        setErr(e.message);
      }
    }
    cargar();
  }, [aulaId]);

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-2xl font-bold text-[#004d8f] mb-4">
        Lista de estudiantes
      </h2>

      {err && <div className="mb-3 text-red-600">{err}</div>}

      <table className="w-full border border-gray-300 rounded-lg overflow-hidden">
        <thead className="bg-[#004d8f] text-white">
          <tr>
            <th className="p-2 text-left">Nombre</th>
            <th className="p-2 text-left">Opciones</th>
          </tr>
        </thead>
        <tbody>
          {estudiantes.map((est) => (
            <tr
              key={est.id}
              className="border-b hover:bg-gray-100 transition cursor-pointer"
            >
              <td className="p-2">{est.nombre}</td>
              <td className="p-2">
                <button className="flex items-center gap-2 bg-[#004d8f] text-white px-3 py-1 rounded-full hover:bg-blue-900 transition">
                  <FaChartLine /> Ver métricas de rendimiento
                </button>
              </td>
            </tr>
          ))}
          {estudiantes.length === 0 && (
            <tr>
              <td className="p-2 text-gray-600" colSpan={2}>
                No hay estudiantes registrados aún.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
