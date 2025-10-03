import React, { useEffect, useState } from "react";

export default function ListaDocentes() {
  const [docentes, setDocentes] = useState([]);
  const [cursos, setCursos] = useState([]); // <- NUEVO
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  async function cargarDocentes() {
    try {
      setLoading(true);
      setErr("");

      const [resDocentes, resCursos] = await Promise.all([
        fetch(import.meta.env.VITE_API_URL + "/docentes"),
        fetch(import.meta.env.VITE_API_URL + "/cursos"),
      ]);

      if (!resDocentes.ok) throw new Error("No se pudo obtener la lista de docentes");
      if (!resCursos.ok) throw new Error("No se pudo obtener la lista de cursos");

      const dataDocentes = await resDocentes.json();
      const dataCursos = await resCursos.json();

      setDocentes(dataDocentes);
      setCursos(dataCursos); // [{id, nombre, docente_id}, ...]
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargarDocentes();
  }, []);

  const handleEditar = (id) => {
    alert(`Editar docente con ID: ${id} (pendiente de implementar)`);
  };

  const handleEliminar = async (id) => {
    if (!window.confirm("¿Seguro que quieres eliminar este docente?")) return;
    try {
      const res = await fetch(import.meta.env.VITE_API_URL + `/docentes/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || "No se pudo eliminar");
      }
      // Actualiza la lista después de eliminar
      setDocentes((prev) => prev.filter((d) => d.id !== id));
      alert("Docente eliminado.");
    } catch (e) {
      alert("Error al eliminar: " + e.message);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-700">Lista de Docentes</h2>

      {loading && <p className="text-gray-600">Cargando...</p>}
      {err && <p className="text-red-600">Error: {err}</p>}

      {!loading && !err && (
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead className="bg-blue-300">
            <tr>
              <th className="border px-3 py-2">Nombre</th>
              <th className="border px-3 py-2">Cursos que puede enseñar</th>
              <th className="border px-3 py-2">Cursos asignados</th>
              <th className="border px-3 py-2">Correo</th>
              <th className="border px-3 py-2">Aula / Tutor</th>
              <th className="border px-3 py-2">Opciones</th>
            </tr>
          </thead>

          <tbody>
            {docentes.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-6 text-gray-500">
                  No hay docentes registrados.
                </td>
              </tr>
            ) : (
              docentes.map((doc) => {
                // Cursos que puede enseñar (del campo texto del docente)
                const cursosPuede = (doc.cursos_que_ensena || "")
                  .split(/\r?\n/)
                  .map(s => s.trim())
                  .filter(Boolean);

                // Cursos asignados (desde la tabla cursos por docente_id)
                const asignados = cursos
                  .filter(c => Number(c.docente_id) === Number(doc.id))
                  .map(c => c.nombre);

                return (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="border px-3 py-2">{doc.nombre}</td>

                    {/* Cursos que puede enseñar */}
                    <td className="border px-3 py-2">
                      {cursosPuede.length === 0 ? (
                        "—"
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {cursosPuede.map((c, idx) => (
                            <span
                              key={idx}
                              className="inline-block px-2 py-1 text-xs rounded bg-blue-100 border border-blue-300"
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Cursos asignados */}
                    <td className="border px-3 py-2">
                      {asignados.length === 0 ? (
                        "—"
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {asignados.map((c, idx) => (
                            <span
                              key={idx}
                              className="inline-block px-2 py-1 text-xs rounded bg-green-100 border border-green-300"
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    <td className="border px-3 py-2">{doc.email}</td>
                    <td className="border px-3 py-2">—</td>
                    <td className="border px-3 py-2 flex gap-2">
                      <button
                        onClick={() => handleEditar(doc.id)}
                        className="px-2 py-1 bg-blue-400 text-white rounded hover:bg-blue-500"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => handleEliminar(doc.id)}
                        className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        🗑️ Eliminar
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
