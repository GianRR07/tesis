import React, { useEffect, useState } from "react";

export default function ListaAulas() {
  const [aulas, setAulas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [editAula, setEditAula] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function cargar() {
      try {
        setLoading(true);
        setErr("");
        const res = await fetch(import.meta.env.VITE_API_URL + "/aulas");
        if (!res.ok) throw new Error("No se pudo obtener la lista de aulas");
        const data = await res.json();
        setAulas(data);
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    }
    cargar();
  }, []);

  const handleEditar = (id) => {
    const aula = aulas.find(a => a.id === id);
    if (!aula) return;
    // abre modal con copia editable
    setEditAula({ id: aula.id, nombre: aula.nombre, grado: aula.grado, seccion: aula.seccion });
  };

  const handleEliminar = (id) => {
    if (window.confirm("¿Seguro que quieres eliminar este aula?")) {
      // pendiente: DELETE /aulas/:id en backend
      setAulas((prev) => prev.filter((a) => a.id !== id));
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-700">Lista de Aulas</h2>

      {loading && <p className="text-gray-600">Cargando...</p>}
      {err && <p className="text-red-600">Error: {err}</p>}

      {!loading && !err && (
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-3 py-2">Nombre</th>
              <th className="border px-3 py-2">Grado</th>
              <th className="border px-3 py-2">Sección</th>
              <th className="border px-3 py-2">Cursos del aula</th>
              <th className="border px-3 py-2">Tutores</th>
              <th className="border px-3 py-2">Opciones</th>
            </tr>
          </thead>

          <tbody>
            {aulas.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-6 text-gray-500">
                  No hay aulas registradas.
                </td>
              </tr>
            ) : (
              aulas.map((aula) => (
                <tr key={aula.id} className="hover:bg-gray-50">
                  <td className="border px-3 py-2">{aula.nombre}</td>
                  <td className="border px-3 py-2">{aula.grado}</td>
                  <td className="border px-3 py-2">{aula.seccion}</td>
                  <td className="border px-3 py-2">
                    {!aula.cursos || aula.cursos.length === 0 ? (
                      "—"
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {aula.cursos.map((c) => (
                          <span
                            key={c.id}
                            className="inline-block px-2 py-1 text-xs rounded bg-blue-100 border border-blue-300"
                            title={c.docente_nombre ? `Docente: ${c.docente_nombre}` : ""}
                          >
                            {c.nombre}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="border px-3 py-2">
                    {!aula.tutores || aula.tutores.length === 0 ? (
                      "—"
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {aula.tutores.map((t) => (
                          <span
                            key={t.id}
                            className="inline-block px-2 py-1 text-xs rounded bg-green-100 border border-green-300"
                          >
                            {t.nombre}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>                  <td className="border px-3 py-2 flex gap-2">
                    <button
                      onClick={() => handleEditar(aula.id)}
                      className="px-2 py-1 bg-blue-400 text-white rounded hover:bg-blue-500"
                    >
                      ✏️ Editar
                    </button>
                    <button
                      onClick={() => handleEliminar(aula.id)}
                      className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      🗑️ Eliminar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}

      {/* Modal editar aula */}
      {editAula && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">Editar Aula</h3>

            <div className="space-y-3">
              <label className="block">
                <span className="text-sm">Nombre</span>
                <input
                  className="mt-1 w-full border rounded p-2"
                  value={editAula.nombre}
                  onChange={(e) => setEditAula(prev => ({ ...prev, nombre: e.target.value }))}
                />
              </label>
              <label className="block">
                <span className="text-sm">Grado</span>
                <input
                  className="mt-1 w-full border rounded p-2"
                  value={editAula.grado}
                  onChange={(e) => setEditAula(prev => ({ ...prev, grado: e.target.value }))}
                />
              </label>
              <label className="block">
                <span className="text-sm">Sección</span>
                <input
                  className="mt-1 w-full border rounded p-2"
                  value={editAula.seccion}
                  onChange={(e) => setEditAula(prev => ({ ...prev, seccion: e.target.value }))}
                />
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                className="px-3 py-2 rounded border"
                onClick={() => setEditAula(null)}
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-60"
                disabled={saving}
                onClick={async () => {
                  try {
                    setSaving(true);
                    const res = await fetch(
                      import.meta.env.VITE_API_URL + `/aulas/${editAula.id}`,
                      {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          nombre: editAula.nombre,
                          grado: editAula.grado,
                          seccion: editAula.seccion,
                        }),
                      }
                    );
                    if (!res.ok) {
                      const t = await res.text();
                      throw new Error(t || "No se pudo actualizar el aula");
                    }
                    const updated = await res.json(); // {id,nombre,grado,seccion}
                    // Actualiza estado local sin re-fetch completo
                    setAulas(prev =>
                      prev.map(a => (a.id === updated.id ? { ...a, ...updated } : a))
                    );
                    setEditAula(null);
                  } catch (e) {
                    alert("Error: " + e.message);
                  } finally {
                    setSaving(false);
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
