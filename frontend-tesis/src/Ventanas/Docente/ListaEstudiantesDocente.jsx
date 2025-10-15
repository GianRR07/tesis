import React, { useState, useEffect } from "react";
import { FaChartLine } from "react-icons/fa";
import { getDocenteIdPreferido } from "../../utils/session";


export default function ListaEstudiantesDocente() {
  const docenteId = getDocenteIdPreferido();

  const [aulas, setAulas] = useState([]);           // [{id,nombre,grado,seccion,cursos}]
  const [aulaSeleccionada, setAulaSeleccionada] = useState("");
  const [estudiantes, setEstudiantes] = useState([]); // [{id,nombre}]
  const [err, setErr] = useState("");

  // Cargar aulas donde enseña el docente
  useEffect(() => {
    async function cargarAulas() {
      setErr("");
      if (!docenteId) {
        setErr("No se pudo identificar el docente actual.");
        return;
      }
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/docentes/${docenteId}/aulas`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "No se pudieron cargar las aulas.");
        setAulas(data);
      } catch (e) {
        setErr(e.message);
      }
    }
    cargarAulas();
  }, [docenteId]);

  // Cargar estudiantes del aula seleccionada
  useEffect(() => {
    async function cargarEstudiantes() {
      setEstudiantes([]);
      if (!aulaSeleccionada) return;
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/docentes/${docenteId}/estudiantes?aulaId=${aulaSeleccionada}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "No se pudo cargar estudiantes.");
        setEstudiantes(data);
      } catch (e) {
        setErr(e.message);
      }
    }
    cargarEstudiantes();
  }, [docenteId, aulaSeleccionada]);

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
          {aulas.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nombre} ({a.grado}-{a.seccion})
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
                <tr key={est.id} className="border-t">
                  <td className="p-2">{est.nombre}</td>
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
