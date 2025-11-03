import React, { useEffect, useState, useRef } from "react";
import { getDocenteIdPreferido } from "../../utils/session";




// Modal de resultado
function ResultadoModal({ open, onClose, data }) {
  if (!open) return null;
  const { nota, veredicto, preguntas = [] } = data || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white w-full max-w-4xl rounded-xl shadow-xl overflow-hidden">
        <div className="px-6 py-4 bg-[#004d8f] text-white">
          <h3 className="text-lg font-semibold">Resultado de la evaluación</h3>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xl font-bold text-[#004d8f]">
              Nota: {nota} / 20
            </div>
            <button
              className="px-3 py-1 rounded-md border border-gray-300 hover:bg-gray-100"
              onClick={onClose}
            >
              Cerrar
            </button>
          </div>

          <p className="text-gray-700">{veredicto}</p>

          {Array.isArray(preguntas) && preguntas.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Detalle por pregunta</h4>
              <div className="max-h-72 overflow-auto border rounded-md">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-2 text-left">#</th>
                      <th className="p-2 text-left">Tipo</th>
                      <th className="p-2 text-left">Correcta</th>
                      <th className="p-2 text-left">Alumno</th>
                      <th className="p-2 text-left">Puntos
                        <span className="text-xs text-gray-500">(de {data?.valorPregunta ?? "?"} c/u)</span>
                      </th>
                      <th className="p-2 text-left">Acierto</th>
                      <th className="p-2 text-left">Feedback</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preguntas.map((p, i) => (
                      <tr key={`${p.numero ?? i}-${p.tipo}`} className="border-t align-top">
                        <td className="p-2 whitespace-nowrap">{p.numero ?? "—"}</td>
                        <td className="p-2 whitespace-nowrap">
                          {p.tipo === "abierta" ? "Abierta" : "Cerrada"}
                        </td>
                        <td className="p-2">
                          {/* Texto largo con wrap */}
                          <div className="max-w-[22rem] break-words">
                            {p.correcta ?? "—"}
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="max-w-[22rem] break-words">
                            {p.alumno ?? "—"}
                          </div>
                        </td>
                        <td className="p-2 whitespace-nowrap">
                          {typeof p.puntos === "number" ? p.puntos.toFixed(2) : "—"}
                        </td>
                        <td className="p-2">{p.acierto ? "✔️" : "❌"}</td>
                        <td className="p-2">
                          <div className="max-w-[20rem] break-words text-gray-600">
                            {p.feedback || ""}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>

                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}




export default function EvaluarExamenDocente() {
  const docenteId = getDocenteIdPreferido();

  const [aulas, setAulas] = useState([]);            // [{id,nombre,grado,seccion,cursos:[{id,nombre,docente_id,docente_nombre}]}]
  const [aulaId, setAulaId] = useState("");
  const [cursosAula, setCursosAula] = useState([]);  // cursos filtrados para este docente
  const [cursoId, setCursoId] = useState("");

  const [estudiantes, setEstudiantes] = useState([]); // [{id,nombre}]
  const [estudianteId, setEstudianteId] = useState("");

  const [examenNombre, setExamenNombre] = useState("");
  const [archivoExamenBase, setArchivoExamenBase] = useState(null); // PDF preguntas
  const [examenId, setExamenId] = useState(null); // id del examen creado (respuesta backend)

  const [archivoExamenAlumno, setArchivoExamenAlumno] = useState(null); // PDF resuelto
  const [ok, setOk] = useState("");
  const [err, setErr] = useState("");


  // Modal de resultado
  const [modalOpen, setModalOpen] = useState(false);
  const [resultado, setResultado] = useState(null);

  // Ref para limpiar el input file del alumno
  const fileAlumnoRef = useRef(null);


  const [cargando, setCargando] = useState(false);



  // 1) Cargar aulas donde enseña el DOCENTE
  useEffect(() => {
    async function cargarAulas() {
      setErr("");
      setOk("");
      if (!docenteId) {
        setErr("No se pudo identificar el docente actual.");
        return;
      }
      try {
        const r = await fetch(`${import.meta.env.VITE_API_URL}/docentes/${docenteId}/aulas`);
        const data = await r.json();
        if (!r.ok) throw new Error(data?.message || "No se pudieron cargar las aulas.");
        setAulas(data);
      } catch (e) {
        setErr(e.message);
      }
    }
    cargarAulas();
  }, [docenteId]);

  // 2) Cuando cambia el aula: preparar cursos del aula asignados a este docente y cargar estudiantes
  useEffect(() => {
    setCursosAula([]);
    setCursoId("");
    setEstudiantes([]);
    setEstudianteId("");
    setExamenId(null);
    setArchivoExamenBase(null);
    setArchivoExamenAlumno(null);
    setOk("");
    if (!aulaId) return;

    // filtrar cursos del aula que son de este docente
    // Cursos del aula para este docente (maneja string vs array)
    (async () => {
      try {
        const aula = aulas.find(a => a.id === Number(aulaId));

        if (Array.isArray(aula?.cursos)) {
          // Caso ideal: ya viene como array [{id,nombre,docente_id,...}]
          const cursos = aula.cursos.filter(c => c.docente_id === Number(docenteId));
          setCursosAula(cursos);
        } else {
          // Fallback: /docentes/:id/aulas trae cursos como string (GROUP_CONCAT)
          // Pedimos /aulas (que sí trae cursos como array) y filtramos allí.
          const rAll = await fetch(`${import.meta.env.VITE_API_URL}/aulas`);
          const allAulas = await rAll.json();
          if (!rAll.ok) throw new Error(allAulas?.message || "No se pudieron cargar aulas detalladas.");

          const aulaDetalle = allAulas.find(x => x.id === Number(aulaId));
          const cursosDet = (aulaDetalle?.cursos || []).filter(c => c.docente_id === Number(docenteId));
          setCursosAula(cursosDet);
        }
      } catch (e) {
        setErr(e.message);
        setCursosAula([]);
      }
    })();


    // cargar estudiantes del aula
    (async () => {
      try {
        const r = await fetch(`${import.meta.env.VITE_API_URL}/docentes/${docenteId}/estudiantes?aulaId=${aulaId}`);
        const data = await r.json();
        if (!r.ok) throw new Error(data?.message || "No se pudo cargar estudiantes.");
        setEstudiantes(data);
      } catch (e) {
        setErr(e.message);
      }
    })();
  }, [aulaId, aulas, docenteId]);

  // 3) Subir EXAMEN BASE (PDF con preguntas) -> crea registro en `examenes`
  async function subirExamenBase() {
    try {
      setErr("");
      setOk("");
      if (!aulaId) throw new Error("Selecciona un salón (aula).");
      if (!cursoId) throw new Error("Selecciona un curso.");
      if (!examenNombre.trim()) throw new Error("Ingresa un nombre para el examen.");
      if (!archivoExamenBase) throw new Error("Carga el PDF del examen con respuestas correctas.");

      const form = new FormData();
      form.append("nombre", examenNombre.trim());
      form.append("curso_id", String(cursoId));
      form.append("archivo", archivoExamenBase); // campo esperado por backend

      const r = await fetch(`${import.meta.env.VITE_API_URL}/examenes`, {
        method: "POST",
        body: form,
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.message || "No se pudo crear el examen.");
      setExamenId(data.id); // guardar id del examen creado
      setOk(`Examen (respuestas correctas) registrado con ID ${data.id}. Ya puedes cargar el examen del alumno.`);
    } catch (e) {
      setErr(e.message);
    }
  }

  function cerrarModalYLimpiar() {
    setModalOpen(false);
    setResultado(null);
    // limpiar alumno
    setEstudianteId("");
    // limpiar archivo del alumno
    setArchivoExamenAlumno(null);
    if (fileAlumnoRef.current) fileAlumnoRef.current.value = "";
  }

  // 4) Subir EXAMEN RESUELTO DEL ALUMNO (PDF) -> crea registro en `evaluaciones`
  async function subirExamenAlumno() {
    try {
      setErr("");
      setOk("");
      setCargando(true);

      if (!examenId) throw new Error("Primero crea el examen base (sube el PDF de preguntas).");
      if (!estudianteId) throw new Error("Selecciona un alumno.");
      if (!archivoExamenAlumno) throw new Error("Carga el PDF del examen resuelto por el alumno.");

      console.log("===== SUBIENDO EXAMEN DEL ALUMNO =====");
      console.log("docenteId:", docenteId);
      console.log("aulaId:", aulaId);
      console.log("cursoId:", cursoId);
      console.log("estudianteId:", estudianteId);
      console.log("examenId:", examenId);
      console.log("archivoExamenAlumno:", archivoExamenAlumno);

      const form = new FormData();
      form.append("examen_id", String(examenId));
      form.append("estudiante_id", String(estudianteId));
      form.append("docente_id", String(docenteId));
      form.append("archivo_resuelto", archivoExamenAlumno);

      for (let [key, value] of form.entries()) {
        console.log("FormData:", key, value);
      }

      // 1) Crear evaluación
      const r = await fetch(`${import.meta.env.VITE_API_URL}/evaluaciones`, {
        method: "POST",
        body: form,
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.message || "No se pudo registrar la evaluación.");

      // 2) Ejecutar auto-evaluación
      const rAuto = await fetch(`${import.meta.env.VITE_API_URL}/evaluaciones/${data.id}/auto`, {
        method: "POST",
      });
      const resAuto = await rAuto.json();
      if (!rAuto.ok) throw new Error(resAuto?.message || "No se pudo evaluar automáticamente.");

      // 3) Mostrar resultado
      setResultado({
        nota: resAuto.nota,
        veredicto: resAuto.veredicto,
        preguntas: resAuto?.detalle?.preguntas ?? [],
        valorPregunta: resAuto?.detalle?.valorPregunta ?? undefined
      });
      setModalOpen(true);

      // 4) Limpieza
      setArchivoExamenAlumno(null);
      if (fileAlumnoRef.current) fileAlumnoRef.current.value = "";
      setOk("");

    } catch (e) {
      setErr(e.message);
    } finally {
      setCargando(false); // siempre apagar el overlay
    }
  }



  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-[#004d8f]">Evaluar Examen</h2>

      {/* Selección de Aula */}
      <div className="mb-4">
        <label className="block font-medium text-gray-700">Seleccione el salón:</label>
        <select
          className="mt-1 w-full p-2 border rounded-md focus:ring focus:ring-blue-300"
          value={aulaId}
          onChange={(e) => setAulaId(e.target.value)}
        >
          <option value="">Seleccione un salón</option>
          {aulas.map(a => (
            <option key={a.id} value={a.id}>
              {a.nombre} ({a.grado}-{a.seccion})
            </option>
          ))}
        </select>
      </div>

      {/* Selección de Curso (del aula, asignado a este docente) */}
      <div className="mb-4">
        <label className="block font-medium text-gray-700">Seleccione el curso:</label>
        <select
          className="mt-1 w-full p-2 border rounded-md focus:ring focus:ring-blue-300"
          value={cursoId}
          onChange={(e) => setCursoId(e.target.value)}
          disabled={!aulaId}
        >
          <option value="">Seleccione un curso</option>
          {cursosAula.map(c => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
      </div>

      {/* Cargar EXAMEN BASE (PDF con preguntas) */}
      <div className="mb-6">
        <label className="block font-medium text-gray-700">Nombre del examen:</label>
        <input
          type="text"
          placeholder="Ej: Examen Bimestral 1"
          className="mt-1 w-full p-2 border rounded-md focus:ring focus:ring-blue-300"
          value={examenNombre}
          onChange={(e) => setExamenNombre(e.target.value)}
          disabled={!cursoId}
        />

        <label className="block font-medium text-gray-700 mt-4">Cargue el examen (PDF con preguntas resueltas):</label>
        <input
          type="file"
          accept=".pdf"
          className="mt-1 w-full p-2 border rounded-md"
          onChange={(e) => setArchivoExamenBase(e.target.files?.[0] || null)}
          disabled={!cursoId}
        />

        <button
          className="mt-3 w-full bg-[#004d8f] text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
          onClick={subirExamenBase}
          disabled={!cursoId || !examenNombre.trim() || !archivoExamenBase}
        >
          Seleccionar PDF como el examen de respuestas correctas
        </button>
      </div>

      {/* Selección de Alumno */}
      <div className="mb-4">
        <label className="block font-medium text-gray-700">Seleccione el alumno:</label>
        <select
          className="mt-1 w-full p-2 border rounded-md focus:ring focus:ring-blue-300"
          value={estudianteId}
          onChange={(e) => setEstudianteId(e.target.value)}
          disabled={!aulaId}
        >
          <option value="">Seleccione un alumno</option>
          {estudiantes.map(e => (
            <option key={e.id} value={e.id}>{e.nombre}</option>
          ))}
        </select>
      </div>

      {/* Cargar EXAMEN DEL ALUMNO (PDF resuelto) */}
      <div className="mb-6">
        <label className="block font-medium text-gray-700">Cargar examen del alumno (PDF):</label>
        <input
          ref={fileAlumnoRef}
          type="file"
          accept=".pdf"
          className="mt-1 w-full p-2 border rounded-md"
          onChange={(e) => setArchivoExamenAlumno(e.target.files?.[0] || null)}
          disabled={!examenId}
        />

        <button
          className="mt-3 w-full bg-[#004d8f] text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
          onClick={subirExamenAlumno}
          disabled={!examenId || !estudianteId || !archivoExamenAlumno}
        >
          Registrar evaluación
        </button>
      </div>

      {ok && <div className="mt-3 text-green-700">{ok}</div>}


      {err && <div className="mt-3 text-red-700">{err}</div>}


      {cargando && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h4 className="text-lg font-semibold mb-3 text-[#004d8f]">
              Evaluando examen...
            </h4>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div className="bg-[#004d8f] h-2 w-1/3 animate-[progress_1.2s_ease-in-out_infinite]" />
            </div>
            <p className="text-sm text-gray-600 mt-3">
              Esto puede tomar unos momentos cuando hay preguntas abiertas.
            </p>
            <style>{`
        @keyframes progress {
          0%   { transform: translateX(-100%); }
          50%  { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
        .animate-[progress_1.2s_ease-in-out_infinite] {
          animation: progress 1.2s ease-in-out infinite;
        }
      `}</style>
          </div>
        </div>
      )}


      <ResultadoModal
        open={modalOpen}
        onClose={cerrarModalYLimpiar}
        data={resultado}
      />
    </div>
  );
}