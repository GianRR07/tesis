import React, { useState, useEffect } from "react";
import { FaBook } from "react-icons/fa";
import { getDocenteIdPreferido } from "../../utils/session";
import RadarChart from "./RadarChart";

export default function ListaEstudiantesDocente() {
  const docenteId = getDocenteIdPreferido();

  const [aulas, setAulas] = useState([]);
  const [aulaSeleccionada, setAulaSeleccionada] = useState("");
  const [estudiantes, setEstudiantes] = useState([]);
  const [resultados, setResultados] = useState({});
  const [err, setErr] = useState("");

  const [modalAbierto, setModalAbierto] = useState(false);
  const [datosModal, setDatosModal] = useState([]); // ahora usamos un solo estado

  // Cargar aulas
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

  // Cargar estudiantes y resultados al seleccionar aula
  useEffect(() => {
    async function cargarEstudiantesYNotas() {
      setEstudiantes([]);
      setResultados({});
      if (!aulaSeleccionada) return;

      try {
        const resEst = await fetch(
          `${import.meta.env.VITE_API_URL}/docentes/${docenteId}/estudiantes?aulaId=${aulaSeleccionada}`
        );
        const dataEst = await resEst.json();
        if (!resEst.ok) throw new Error(dataEst?.message || "No se pudo cargar estudiantes.");
        const estudiantesNormalizados = dataEst.map(e => ({ ...e, id: Number(e.id) }));
        setEstudiantes(estudiantesNormalizados);

        // 1) GET original (detalle completo: correctas/incorrectas/preguntas)
        const resNotas = await fetch(
          `${import.meta.env.VITE_API_URL}/docentes/${docenteId}/resultados?aulaId=${aulaSeleccionada}`
        );
        const dataNotas = await resNotas.json();
        if (!resNotas.ok) throw new Error(dataNotas?.message || "No se pudieron cargar resultados.");

        // 2) GET de evaluaciones solo para traer veredicto (sin romper el 1)
        const resVerd = await fetch(
          `${import.meta.env.VITE_API_URL}/evaluaciones/resultados?docenteId=${docenteId}&aulaId=${aulaSeleccionada}`
        );
        const dataVerd = await resVerd.json();
        if (!resVerd.ok) throw new Error(dataVerd?.message || "No se pudieron cargar veredictos.");

        // Indexa veredictos por clave estable: estudiante|curso|examen
        const mapaVeredictos = new Map(
          dataVerd.map(v => {
            const clave = `${v.estudiante_id}|${v.curso_nombre}|${v.examen_nombre}`;
            return [clave, v.veredicto ?? null];
          })
        );

        const resultadosPorEst = {};
        dataNotas.forEach(r => {
          if (!resultadosPorEst[r.estudiante_id]) resultadosPorEst[r.estudiante_id] = [];
          const clave = `${r.estudiante_id}|${r.curso_nombre}|${r.examen_nombre}`;
          const veredicto = mapaVeredictos.get(clave) ?? null;

          resultadosPorEst[r.estudiante_id].push({
            curso: r.curso_nombre,
            examen: r.examen_nombre,
            nota: r.nota,
            correctas: r.total_correctas ?? 0,
            incorrectas: r.total_incorrectas ?? 0,
            preguntas_correctas: r.preguntas_correctas || [],
            preguntas_marcadas: r.preguntas_marcadas || [],
            mostrarDetalle: false,
            veredicto,
          });
        });
        setResultados(resultadosPorEst);

      } catch (e) {
        setErr(e.message);
      }
    }
    cargarEstudiantesYNotas();
  }, [docenteId, aulaSeleccionada]);

  const toggleDetalle = (estudianteId, index) => {
    setResultados(prev => ({
      ...prev,
      [estudianteId]: prev[estudianteId].map((nota, i) =>
        i === index ? { ...nota, mostrarDetalle: !nota.mostrarDetalle } : nota
      )
    }));
  };

  // Abrir modal con datos combinados
  const abrirModal = (datos) => {
    setDatosModal(datos);
    setModalAbierto(true);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-[#004d8f]">Lista de estudiantes</h2>

      {/* Selector de aula */}
      <div className="mb-6">
        <label className="block font-medium text-gray-700 mb-1">Nombre del Aula:</label>
        <select
          value={aulaSeleccionada}
          onChange={(e) => setAulaSeleccionada(Number(e.target.value))}
        >
          <option value="">Seleccione un aula</option>
          {aulas.map(a => (
            <option key={a.id} value={a.id}>
              {a.nombre} ({a.grado}-{a.seccion})
            </option>
          ))}
        </select>
      </div>

      {/* Lista de estudiantes */}
      {aulaSeleccionada && (
        <div className="space-y-6">
          {estudiantes.map(est => {
            const notas = resultados[est.id] || [];

            return (
              <div
                key={est.id}
                className="border border-gray-300 rounded-lg p-4 shadow-sm hover:shadow-md transition"
              >
                <h3 className="text-lg font-semibold text-[#004d8f] mb-3">{est.nombre}</h3>

                {notas.length === 0 && (
                  <p className="text-gray-500 italic">Sin evaluaciones registradas</p>
                )}

                {notas.length > 0 && (
                  <>
                    {/* Notas en texto */}
                    <div className="space-y-2 mb-4">
                      {notas.map((n, i) => (
                        <div key={i} className="border-t pt-2 text-sm text-gray-700">
                          <div className="flex justify-between items-center mb-1">
                            <div className="flex items-center gap-2">
                              <FaBook className="text-[#004d8f]" />
                              <span className="font-medium">
                                {n.curso} — <span className="italic text-gray-600">{n.examen}</span>
                              </span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="font-semibold text-[#004d8f]">
                                Nota: {n.nota ? n.nota.toFixed(2) : "—"} | {n.correctas} ✔️ / {n.incorrectas} ❌
                              </span>
                              <button
                                className="text-blue-600 underline text-xs"
                                onClick={() => toggleDetalle(est.id, i)}
                              >
                                Ver respuestas marcadas
                              </button>
                            </div>
                          </div>

                          {n.mostrarDetalle && (
                            <div className="flex justify-between text-xs bg-gray-100 p-2 rounded">
                              <div>
                                <strong>Marcadas:</strong>
                                <ul>
                                  {n.preguntas_marcadas.map(p => (
                                    <li key={p.numero}>Pregunta {p.numero}: {p.marcado}</li>
                                  ))}
                                </ul>
                              </div>
                              <div>
                                <strong>Correctas:</strong>
                                <ul>
                                  {n.preguntas_correctas.map(num => (
                                    <li key={num}>Pregunta {num}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Botón para abrir modal con RadarChart */}
                    <button
                      onClick={() =>
                        abrirModal(
                          notas.map(n => ({
                            curso: n.curso,
                            examen: n.examen,
                            nota: n.nota ?? 0,
                            veredicto: n.veredicto ?? null,
                          }))
                        )
                      }
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                    >
                      Ver rendimiento
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {err && <div className="mt-4 text-red-600">{err}</div>}

      {/* Modal */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div
            className="bg-white rounded-lg p-8 w-[90%] max-w-5xl relative shadow-xl overflow-auto"
            style={{ maxHeight: "90vh" }}
          >
            <button
              onClick={() => setModalAbierto(false)}
              className="absolute top-3 right-4 text-gray-500 hover:text-gray-700 text-2xl font-bold"
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold text-[#004d8f] mb-6 text-center">
              Rendimiento del estudiante
            </h2>
            <div className="w-full h-[450px] flex items-center justify-center">
              <RadarChart datos={datosModal} />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
