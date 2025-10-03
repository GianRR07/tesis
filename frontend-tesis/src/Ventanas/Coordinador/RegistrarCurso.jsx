import React, { useEffect, useState } from "react";

export default function RegistrarCurso() {
  const [nombreCurso, setNombreCurso] = useState("");
  const [docenteId, setDocenteId] = useState("");
  const [docentes, setDocentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    async function cargarDocentes() {
      try {
        setLoading(true);
        setErr("");
        const res = await fetch(import.meta.env.VITE_API_URL + "/docentes");
        if (!res.ok) throw new Error("No se pudo obtener la lista de docentes");
        const data = await res.json();
        // Solo necesitamos id y nombre para el select
        const soloNombre = data.map(d => ({ id: d.id, nombre: d.nombre }));
        setDocentes(soloNombre);
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    }
    cargarDocentes();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombreCurso) {
      alert("El nombre del curso es obligatorio");
      return;
    }
    try {
      const res = await fetch(import.meta.env.VITE_API_URL + "/cursos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombreCurso,
          docenteId: docenteId ? Number(docenteId) : null,
        }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || "No se pudo registrar el curso");
      }
      setNombreCurso("");
      setDocenteId("");
      alert("Curso registrado correctamente.");
    } catch (e) {
      alert("Error al registrar: " + e.message);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-[#004d8f]">Registro de Curso</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nombre del curso */}
        <div>
          <label className="block font-medium text-gray-700">Nombre del curso:</label>
          <input
            type="text"
            placeholder="Ej: Matemáticas"
            value={nombreCurso}
            onChange={(e) => setNombreCurso(e.target.value)}
            className="mt-1 w-full p-2 border rounded-md focus:ring focus:ring-blue-300"
          />
        </div>

        {/* Selección de docente */}
        <div>
          <label className="block font-medium text-gray-700">Docente:</label>
          {loading ? (
            <p className="text-gray-500">Cargando docentes...</p>
          ) : err ? (
            <p className="text-red-600">Error: {err}</p>
          ) : (
            <select
              value={docenteId}
              onChange={(e) => setDocenteId(e.target.value)}
              className="mt-1 w-full p-2 border rounded-md focus:ring focus:ring-blue-300"
            >
              <option value="">-- (Opcional) Seleccione un docente --</option>
              {docentes.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nombre}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Botón */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 bg-[#004d8f] text-white rounded-lg hover:bg-blue-700 transition"
          >
            Registrar Curso
          </button>
        </div>
      </form>
    </div>
  );
}
