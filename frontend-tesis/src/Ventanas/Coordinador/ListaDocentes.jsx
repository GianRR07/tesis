import React, { useEffect, useState } from "react";

export default function ListaDocentes() {
  const [docentes, setDocentes] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [aulas, setAulas] = useState([]);     // <- AGREGADO
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [editDoc, setEditDoc] = useState(null); // {id,nombre,email,telefono,cursos_que_ensena,correo_ingreso}
  const [savingDoc, setSavingDoc] = useState(false);

  async function cargarDocentes() {
    try {
      setLoading(true);
      setErr("");

      const [resDocentes, resCursos, resAulas] = await Promise.all([
        fetch(import.meta.env.VITE_API_URL + "/docentes"),
        fetch(import.meta.env.VITE_API_URL + "/cursos"),
        fetch(import.meta.env.VITE_API_URL + "/aulas"), // <- AGREGADO
      ]);

      if (!resDocentes.ok) throw new Error("No se pudo obtener la lista de docentes");
      if (!resCursos.ok) throw new Error("No se pudo obtener la lista de cursos");
      if (!resAulas.ok) throw new Error("No se pudo obtener la lista de aulas");

      const [dataDocentes, dataCursos, dataAulas] = await Promise.all([
        resDocentes.json(),
        resCursos.json(),
        resAulas.json(),
      ]);

      setDocentes(dataDocentes);
      setCursos(dataCursos);          // [{id, nombre, docente_id}, ...]
      setAulas(dataAulas);            // [{id, nombre, grado, seccion, tutores:[{id,nombre}]}]
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
    const d = docentes.find(x => x.id === id);
    if (!d) return;
    setEditDoc({
      id: d.id,
      nombre: d.nombre || "",
      email: d.email || "",
      telefono: d.telefono || "",
      cursos_que_ensena: d.cursos_que_ensena || "",
      correo_ingreso: d.correo_ingreso || "",
    });
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
                    <td className="border px-3 py-2">
                      {(() => {
                        const aulasTutor = aulas
                          .filter(a => Array.isArray(a.tutores) && a.tutores.some(t => Number(t.id) === Number(doc.id)))
                          .map(a => a.nombre);

                        return aulasTutor.length === 0 ? (
                          "—"
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {aulasTutor.map((nom, idx) => (
                              <span
                                key={idx}
                                className="inline-block px-2 py-1 text-xs rounded bg-purple-100 border border-purple-300"
                              >
                                {nom}
                              </span>
                            ))}
                          </div>
                        );
                      })()}
                    </td>                    <td className="border px-3 py-2 flex gap-2">
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

      {/* Modal editar docente */}
      {editDoc && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Editar Docente</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-sm">Nombre</span>
                <input
                  className="mt-1 w-full border rounded p-2"
                  value={editDoc.nombre}
                  onChange={(e) => setEditDoc(prev => ({ ...prev, nombre: e.target.value }))}
                />
              </label>

              <label className="block">
                <span className="text-sm">Correo (contacto)</span>
                <input
                  type="email"
                  className="mt-1 w-full border rounded p-2"
                  value={editDoc.email}
                  onChange={(e) => setEditDoc(prev => ({ ...prev, email: e.target.value }))}
                />
              </label>

              <label className="block">
                <span className="text-sm">Teléfono</span>
                <input
                  className="mt-1 w-full border rounded p-2"
                  value={editDoc.telefono}
                  onChange={(e) => setEditDoc(prev => ({ ...prev, telefono: e.target.value }))}
                />
              </label>

              <label className="block">
                <span className="text-sm">Correo de ingreso</span>
                <input
                  type="email"
                  className="mt-1 w-full border rounded p-2"
                  value={editDoc.correo_ingreso}
                  onChange={(e) => setEditDoc(prev => ({ ...prev, correo_ingreso: e.target.value }))}
                />
              </label>
            </div>

            <label className="block mt-4">
              <span className="text-sm">Cursos que puede enseñar (uno por línea)</span>
              <textarea
                className="mt-1 w-full border rounded p-2 h-28"
                value={editDoc.cursos_que_ensena}
                onChange={(e) => setEditDoc(prev => ({ ...prev, cursos_que_ensena: e.target.value }))}
              />
            </label>

            <div className="mt-2 text-xs text-gray-500">
              * Para cambiar contraseña, lo haremos en una pantalla aparte (opcional).
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button className="px-3 py-2 rounded border" onClick={() => setEditDoc(null)} disabled={savingDoc}>
                Cancelar
              </button>
              <button
                className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-60"
                disabled={savingDoc}
                onClick={async () => {
                  try {
                    setSavingDoc(true);
                    const res = await fetch(
                      import.meta.env.VITE_API_URL + `/docentes/${editDoc.id}`,
                      {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          nombre: editDoc.nombre,
                          email: editDoc.email,
                          telefono: editDoc.telefono,
                          cursos_que_ensena: editDoc.cursos_que_ensena,
                          correo_ingreso: editDoc.correo_ingreso,
                        }),
                      }
                    );
                    if (!res.ok) {
                      const t = await res.text();
                      throw new Error(t || "No se pudo actualizar el docente");
                    }
                    const updated = await res.json(); // devuelve campos básicos
                    setDocentes(prev =>
                      prev.map(d => (d.id === updated.id ? { ...d, ...updated } : d))
                    );
                    setEditDoc(null);
                  } catch (e) {
                    alert("Error: " + e.message);
                  } finally {
                    setSavingDoc(false);
                  }
                }}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
