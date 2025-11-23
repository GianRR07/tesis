import React, { useState, useEffect, useRef } from "react";
import { getTutorAulaIdPreferida, getTutorIdPreferido } from "../../utils/session";


function ResultadoModal({ open, onClose, data }) {
  if (!open || !data) return null;
  const { nota, veredicto, preguntas = [], valorPregunta, examenNombre } = data;

  const formatPuntos = (p) => {
    if (p === null || p === undefined || isNaN(Number(p))) return "—";
    return Number(p).toFixed(2);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white w-full max-w-5xl rounded-lg shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-[#004d8f] text-white">
          <div>
            <h3 className="text-lg font-semibold">Resultado de la evaluación</h3>
            {examenNombre && <div className="text-sm opacity-90 mt-1">{examenNombre}</div>}
          </div>
          <button
            onClick={onClose}
            className="bg-white/10 text-white px-3 py-1 rounded-md hover:bg-white/20"
          >
            Cerrar
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <div className="text-2xl font-bold text-[#004d8f]">Nota: {nota ?? "—"} / 20</div>
            {veredicto && <p className="mt-2 text-gray-700">{veredicto}</p>}
          </div>

          <div className="mb-3 text-sm text-gray-600">
            <strong>Valor por pregunta:</strong> {valorPregunta ?? "—"}
          </div>

          <div>
            <h4 className="font-semibold mb-2">Detalle por pregunta</h4>
            <div className="max-h-80 overflow-auto border rounded-md">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="p-2 text-left">#</th>
                    <th className="p-2 text-left">Tipo</th>
                    <th className="p-2 text-left">Correcta</th>
                    <th className="p-2 text-left">Alumno</th>
                    <th className="p-2 text-left">Puntos</th>
                    <th className="p-2 text-left">Acierto</th>
                    <th className="p-2 text-left">Feedback</th>
                  </tr>
                </thead>

                <tbody>
                  {preguntas.length === 0 && (
                    <tr>
                      <td className="p-4 text-gray-600" colSpan={7}>
                        No hay detalle de preguntas.
                      </td>
                    </tr>
                  )}

                  {preguntas.map((p, i) => {
                    const puntaje = Number(p?.puntaje ?? 0);
                    const acierto = puntaje >= 1 - 1e-6 ? "✔️" : puntaje > 0 ? "◐" : "❌";
                    return (
                      <tr key={i} className="border-t align-top">
                        <td className="p-2 align-top whitespace-nowrap">{p.numero ?? i + 1}</td>
                        <td className="p-2 align-top whitespace-nowrap">{p.tipo ?? "—"}</td>
                        <td className="p-2 align-top">
                          <div className="max-w-[26rem] break-words">{p.correcta ?? "—"}</div>
                        </td>
                        <td className="p-2 align-top">
                          <div className="max-w-[26rem] break-words">{p.alumno ?? "—"}</div>
                        </td>
                        <td className="p-2 align-top whitespace-nowrap">
                          {formatPuntos(p.puntos)} {valorPregunta ? `/ ${valorPregunta}` : ""}
                        </td>
                        <td className="p-2 align-top">{acierto}</td>
                        <td className="p-2 align-top">
                          <div className="max-w-[18rem] break-words text-gray-700">
                            {p.feedback ?? ""}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


export default function EvaluarExamen() {
  const [alumno, setAlumno] = useState("");
  const [archivoAlumno, setArchivoAlumno] = useState(null);
  const [archivoBase, setArchivoBase] = useState(null);
  const [previewBase, setPreviewBase] = useState(null);
  const [alumnos, setAlumnos] = useState([]);
  const [examenNombre, setExamenNombre] = useState("");
  const [examenId, setExamenId] = useState(null);

  const [ok, setOk] = useState("");
  const [err, setErr] = useState("");
  const [cargando, setCargando] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [resultado, setResultado] = useState(null);

 const aulaId = getTutorAulaIdPreferida();
const tutorId = getTutorIdPreferido(); 
const docenteId = tutorId; 

  const fileAlumnoRef = useRef(null);

  useEffect(() => {
    async function cargar() {
      if (!aulaId) return;
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/aulas/${aulaId}/estudiantes`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "No se pudo cargar alumnos.");
        setAlumnos(data);
      } catch (e) {
        console.error(e);
        setErr(e.message);
      }
    }
    cargar();
  }, [aulaId]);

  
  const handleBaseFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setArchivoBase(file);
    if (!file) {
      setPreviewBase(null);
      return;
    }
    setPreviewBase(URL.createObjectURL(file));
  };

  const handleAlumnoFileChange = (e) => {
    setArchivoAlumno(e.target.files?.[0] || null);
  };

  
  async function subirExamenBase() {
    try {
      setErr("");
      setOk("");
      if (!examenNombre.trim()) throw new Error("Ingrese nombre del examen.");
      if (!archivoBase) throw new Error("Seleccione el PDF/imagen del examen base.");

      const form = new FormData();
      form.append("nombre", examenNombre.trim());
      
      
      form.append("curso_id", String(1));
      form.append("archivo", archivoBase);

      const r = await fetch(`${import.meta.env.VITE_API_URL}/examenes`, {
        method: "POST",
        body: form,
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.message || "No se pudo crear el examen.");
      setExamenId(data.id);
      setOk(`Examen "${examenNombre.trim()}" registrado con ID ${data.id}.`);
    } catch (e) {
      setErr(e.message);
    }
  }

  
  async function subirEvaluacion() {
    try {
      setErr("");
      setOk("");
      setCargando(true);

      if (!examenId) throw new Error("Sube el examen base primero.");
      if (!alumno) throw new Error("Selecciona un alumno.");
      if (!archivoAlumno) throw new Error("Sube el examen resuelto del alumno.");
      if (!docenteId) throw new Error("No se encontró docente_id (necesario).");

      const form = new FormData();
      form.append("examen_id", String(examenId));
form.append("estudiante_id", String(alumno));
form.append("docente_id", String(docenteId));


if (tutorId) {
  form.append("tutor_id", String(tutorId));
}

form.append("archivo_resuelto", archivoAlumno);


      const r = await fetch(`${import.meta.env.VITE_API_URL}/evaluaciones`, {
        method: "POST",
        body: form,
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.message || "No se pudo registrar la evaluación.");

      
      const rAuto = await fetch(`${import.meta.env.VITE_API_URL}/evaluaciones/${data.id}/auto`, {
        method: "POST",
      });
      const resAuto = await rAuto.json();
      if (!rAuto.ok) throw new Error(resAuto?.message || "Error en evaluación automática.");

      const textoVeredicto = resAuto.veredicto?.replace(/El alumno necesita refuerzo.*?repaso.*?\./i, "").trim();

setResultado({
  nota: resAuto.nota ?? null,
  veredicto: textoVeredicto || "",
  preguntas: resAuto?.detalle?.preguntas ?? [],
  valorPregunta: resAuto?.detalle?.valorPregunta ?? null,
  examenNombre: examenNombre.trim() || null,
});

      setModalOpen(true);
      setOk("Evaluación completada.");
      
      setArchivoAlumno(null);
      if (fileAlumnoRef.current) fileAlumnoRef.current.value = "";
    } catch (e) {
      setErr(e.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-[#004d8f]">Evaluar Examen</h2>

      <div className="mb-4">
        <label className="block font-medium text-gray-700">Nombre del examen:</label>
        <input
          type="text"
          value={examenNombre}
          onChange={(e) => setExamenNombre(e.target.value)}
          className="mt-1 w-full p-2 border rounded-md"
          placeholder="Ej: Examen Bimestral - Biología"
        />
      </div>

      <div className="mb-6">
        <label className="block font-medium text-gray-700">Suba el examen base (PDF o imagen):</label>
        <input
          type="file"
          accept=".pdf,image/*"
          onChange={handleBaseFileChange}
          className="mt-1 w-full p-2 border rounded-md"
        />

        <div className="flex gap-3 mt-3">
          <button
            onClick={subirExamenBase}
            disabled={!archivoBase || !examenNombre.trim()}
            className="bg-[#004d8f] text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Subir examen base
          </button>
          {examenId && <div className="self-center text-sm text-green-700">ID examen: {examenId}</div>}
        </div>

        {previewBase && (
          <div className="mt-4 border rounded-lg p-3 bg-gray-50">
            {archivoBase?.type === "application/pdf" ? (
              <iframe src={previewBase} title="Vista previa PDF" className="w-full h-[420px] border rounded-md" />
            ) : (
              <img src={previewBase} alt="Vista previa" className="max-h-[420px] w-auto mx-auto rounded-lg" />
            )}
          </div>
        )}
      </div>

      <div className="mb-4">
        <label className="block font-medium text-gray-700">Seleccione un alumno:</label>
        <select
          value={alumno}
          onChange={(e) => setAlumno(e.target.value)}
          className="mt-1 w-full p-2 border rounded-md"
        >
          <option value="">-- Seleccione un alumno --</option>
          {alumnos.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-6">
        <label className="block font-medium text-gray-700">Cargue el examen del alumno (PDF):</label>
        <input
          ref={fileAlumnoRef}
          type="file"
          accept=".pdf"
          onChange={handleAlumnoFileChange}
          className="mt-1 w-full p-2 border rounded-md"
          disabled={!examenId}
        />

        <button
          onClick={subirEvaluacion}
          disabled={!examenId || !alumno || !archivoAlumno}
          className="mt-3 w-full bg-[#004d8f] text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          Realizar evaluación
        </button>
      </div>

      {ok && <div className="mt-3 text-green-700">{ok}</div>}
      {err && <div className="mt-3 text-red-700">{err}</div>}

      {cargando && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md text-center">
            <h4 className="text-lg font-semibold mb-3 text-[#004d8f]">Evaluando examen...</h4>
            <p className="text-sm text-gray-600">Esto puede tardar unos segundos.</p>
          </div>
        </div>
      )}

      <ResultadoModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setResultado(null);
        }}
        data={resultado}
      />
    </div>
  );
}
