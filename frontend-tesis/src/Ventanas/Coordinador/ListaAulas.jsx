import React, { useEffect, useState } from "react";

export default function ListaAulas() {
  const [aulas, setAulas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

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
    alert(`Editar aula con ID: ${id} (pendiente)`);
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
              <th className="border px-3 py-2">Tutor</th>
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
                  <td className="border px-3 py-2">{aula.tutor_nombre || "—"}</td>
                  <td className="border px-3 py-2 flex gap-2">
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
    </div>
  );
}
