import React, { useState, useEffect } from "react";
import { FaChartLine } from "react-icons/fa";
import { getDocenteIdPreferido, getTutorIdPreferido } from "../../utils/session";
import RadarChart from "./RadarChart";
import RadarChart2 from "./RadarChart2";

export default function ListaEstudiantesDocente() {
  const docenteId = getDocenteIdPreferido();
  const tutorId = getTutorIdPreferido();

  const [aulas, setAulas] = useState([]);
  const [aulaSeleccionada, setAulaSeleccionada] = useState("");
  const [estudiantes, setEstudiantes] = useState([]);
  const [resultados, setResultados] = useState({});
  const [err, setErr] = useState("");

  const [modalAbierto, setModalAbierto] = useState(false);
  const [datosModal, setDatosModal] = useState([]);
  const [tipoModal, setTipoModal] = useState("curso"); 

  
  useEffect(() => {
    async function cargarAulas() {
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
        console.error("Error al cargar aulas:", e);
        setErr(e.message);
      }
    }
    cargarAulas();
  }, [docenteId]);

  
  useEffect(() => {
    async function cargarDatos() {
      setEstudiantes([]);
      setResultados({});
      if (!aulaSeleccionada || !tutorId) return;

      try {
        
        const resEst = await fetch(
          `${import.meta.env.VITE_API_URL}/docentes/${docenteId}/estudiantes?aulaId=${aulaSeleccionada}`
        );
        const dataEst = await resEst.json();
        if (!resEst.ok) throw new Error(dataEst?.message || "No se pudo cargar estudiantes.");
        setEstudiantes(dataEst);

        
        const resRes = await fetch(
          `${import.meta.env.VITE_API_URL}/evaluaciones/resultados/tutor/por-curso?tutorId=${tutorId}&aulaId=${aulaSeleccionada}`
        );
        const dataRes = await resRes.json();
        if (!resRes.ok) throw new Error(dataRes?.message || "No se pudieron cargar resultados.");

        
        const agrupados = {};
        for (const curso in dataRes) {
          for (const estudianteId in dataRes[curso]) {
            if (!agrupados[estudianteId]) agrupados[estudianteId] = [];
            dataRes[curso][estudianteId].examenes.forEach((ex) => {
              agrupados[estudianteId].push({
                ...ex,
                curso,
                examen: ex.nombre,
              });
            });
          }
        }
        setResultados(agrupados);
      } catch (e) {
        console.error("Error al cargar datos:", e);
        setErr(e.message);
      }
    }
    cargarDatos();
  }, [aulaSeleccionada, docenteId, tutorId]);

  const abrirModal = (datos, tipo = "curso") => {
    setDatosModal(datos);
    setTipoModal(tipo);
    setModalAbierto(true);
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-2xl font-bold text-[#004d8f] mb-4">Lista de estudiantes</h2>

      <div className="mb-4">
        <label className="block font-medium text-gray-700 mb-1">Seleccione un aula:</label>
        <select
          value={aulaSeleccionada}
          onChange={(e) => setAulaSeleccionada(Number(e.target.value))}
          className="w-full border rounded-md p-2"
        >
          <option value="">-- Seleccione un aula --</option>
          {aulas.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nombre} ({a.grado}-{a.seccion})
            </option>
          ))}
        </select>
      </div>

      {err && <div className="mb-3 text-red-600">{err}</div>}

      <table className="w-full border border-gray-300 rounded-lg overflow-hidden">
        <thead className="bg-[#004d8f] text-white">
          <tr>
            <th className="p-2 text-left">Nombre</th>
            <th className="p-2 text-left">Opciones</th>
          </tr>
        </thead>

        <tbody>
          {estudiantes.map((est) => {
            const resultadosEstudiante = resultados[est.id] || [];

            
            const resultadosPorCurso = resultadosEstudiante.reduce((acc, curr) => {
              if (!acc[curr.curso]) acc[curr.curso] = [];
              acc[curr.curso].push(curr);
              return acc;
            }, {});

            const cursos = Object.keys(resultadosPorCurso);

            return (
              <tr key={est.id} className="border-b hover:bg-gray-100 transition">
                <td className="p-3 align-top">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-lg">{est.nombre}</span>

                    {resultadosEstudiante.length > 0 && (
                      <button
                        onClick={() => {
                          
                          const promedios = cursos.map((curso) => {
                            const notas = resultadosPorCurso[curso].map((r) => r.nota);
                            const promedio =
                              notas.reduce((sum, n) => sum + n, 0) / notas.length;
                            return { curso, promedio: Number(promedio.toFixed(2)) };
                          });
                          abrirModal(promedios, "general");
                        }}
                        className="flex items-center gap-0.5 bg-green-600 text-white px-3 py-1 rounded-full hover:bg-green-700 transition text-sm"
                      >
                        <FaChartLine /> Ver métricas generales
                      </button>
                    )}
                  </div>

                  <div>
                    <div className="font-semibold text-gray-600 mb-1">Cursos</div>
                    {cursos.length > 0 ? (
                      <div className="space-y-2">
                        {cursos.map((cursoNombre) => (
                          <div
                            key={cursoNombre}
                            className="flex items-center justify-between bg-gray-100 p-2 rounded-md"
                          >
                            <span className="text-gray-700">{cursoNombre}</span>
                            {resultadosPorCurso[cursoNombre]?.length > 0 ? (
                              <button
                                onClick={() =>
                                  abrirModal(resultadosPorCurso[cursoNombre], "curso")
                                }
                                className="flex items-center gap-14 bg-[#004d8f] text-white px-3 py-1 rounded-full hover:bg-blue-900 transition text-sm"
                              >
                                <FaChartLine /> Ver métricas
                              </button>
                            ) : (
                              <span className="text-gray-400 italic text-sm">
                                Sin métricas disponibles
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400 italic text-sm">Sin cursos</span>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}

          {estudiantes.length === 0 && (
            <tr>
              <td className="p-3 text-gray-600" colSpan={2}>
                No hay estudiantes registrados aún.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {modalAbierto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-4xl relative">
            <button
              onClick={() => setModalAbierto(false)}
              className="absolute top-3 right-4 text-gray-500 hover:text-gray-700 text-2xl font-bold"
            >
              &times;
            </button>
            <h3 className="text-xl font-bold text-[#004d8f] mb-4 text-center">
              Métricas de rendimiento del estudiante
            </h3>
            <div className="h-[420px] flex items-center justify-center">
              {tipoModal === "curso" ? (
                <RadarChart datos={datosModal} />
              ) : (
                <RadarChart2 datos={datosModal} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
