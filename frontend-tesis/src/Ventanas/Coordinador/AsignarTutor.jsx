import React, { useEffect, useState } from "react";

export default function AsignarTutor() {
  const [aulas, setAulas] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [aulaSeleccionada, setAulaSeleccionada] = useState(null);
  const [seleccionDocentes, setSeleccionDocentes] = useState([]); // IDs a asignar (máx 2)

  const toggleAula = (id) => {
    setAulaSeleccionada((prev) => {
      if (prev?.id === id) return null; // si ya estaba seleccionada, se deselecciona
      const a = aulas.find((x) => x.id === id);
      return a || null;
    });
  };


  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  async function cargarTodo() {
    try {
      setLoading(true);
      setErr("");
      const [rAulas, rDocentes] = await Promise.all([
        fetch(import.meta.env.VITE_API_URL + "/aulas"),
        fetch(import.meta.env.VITE_API_URL + "/docentes"),
      ]);
      if (!rAulas.ok) throw new Error("No se pudo obtener aulas");
      if (!rDocentes.ok) throw new Error("No se pudo obtener docentes");
      const dataAulas = await rAulas.json();
      const dataDocentes = await rDocentes.json();
      setAulas(dataAulas); // cada aula trae aula.tutores [{id,nombre}]
      setDocentes(dataDocentes.map(d => ({ id: d.id, nombre: d.nombre })));
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargarTodo();
  }, []);

  const toggleDocente = (id) => {
    setSeleccionDocentes(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 2) {
        alert("Solo puedes seleccionar hasta 2 tutores para asignar.");
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleAsignar = async () => {
    if (!aulaSeleccionada || seleccionDocentes.length === 0) {
      alert("Selecciona un aula y al menos un docente (máx 2).");
      return;
    }
    try {
      const res = await fetch(
        import.meta.env.VITE_API_URL + `/aulas/${aulaSeleccionada.id}/tutores`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ docentesIds: seleccionDocentes }),
        }
      );
      const t = await res.text();
      if (!res.ok) throw new Error(t || "No se pudo asignar");
      await cargarTodo(); // refresca listas y tutores del aula
      setSeleccionDocentes([]);
      alert("Tutor(es) asignado(s) correctamente.");
    } catch (e) {
      alert("Error: " + e.message);
    }
  };

  const quitarTutor = async (docenteId) => {
    if (!aulaSeleccionada) return;
    if (!confirm("¿Quitar este tutor del aula?")) return;
    try {
      const res = await fetch(
        import.meta.env.VITE_API_URL + `/aulas/${aulaSeleccionada.id}/tutores/${docenteId}`,
        { method: "DELETE" }
      );
      if (!res.ok && res.status !== 204) {
        const t = await res.text();
        throw new Error(t || "No se pudo quitar el tutor");
      }
      await cargarTodo();
      // mantiene la selección del aula
    } catch (e) {
      alert("Error: " + e.message);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-700">Asignar Tutor</h2>

      {loading && <p className="text-gray-500">Cargando...</p>}
      {err && <p className="text-red-600">Error: {err}</p>}

      {!loading && !err && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Lista de aulas */}
          <div className="border rounded-lg p-4 shadow-sm">
            <h3 className="text-lg font-semibold mb-2">Aulas</h3>
            <table className="w-full border-collapse border border-gray-300 text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-gray-300 px-2 py-1">Nombre</th>
                  <th className="border border-gray-300 px-2 py-1">Grado</th>
                  <th className="border border-gray-300 px-2 py-1">Sección</th>
                  <th className="border border-gray-300 px-2 py-1">Tutores</th>
                  <th className="border border-gray-300 px-2 py-1 text-center">Seleccionar</th>
                </tr>
              </thead>
              <tbody>
                {aulas.map((aula) => {
                  const checked = aulaSeleccionada?.id === aula.id;
                  return (
                    <tr
                      key={aula.id}
                      className={`hover:bg-blue-50 ${checked ? "bg-blue-100" : ""}`}
                    >
                      <td className="border border-gray-300 px-2 py-1">{aula.nombre}</td>
                      <td className="border border-gray-300 px-2 py-1">{aula.grado}</td>
                      <td className="border border-gray-300 px-2 py-1">{aula.seccion}</td>
                      <td className="border border-gray-300 px-2 py-1">
                        {(!aula.tutores || aula.tutores.length === 0) ? "—" : (
                          <div className="flex flex-wrap gap-2">
                            {aula.tutores.map(t => (
                              <span key={t.id} className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-green-100 border border-green-300">
                                {t.nombre}
                                {checked && (
                                  <button
                                    className="ml-1 text-red-600 hover:text-red-800"
                                    title="Quitar"
                                    onClick={(e) => { e.stopPropagation(); quitarTutor(t.id); }}
                                  >
                                    ✖
                                  </button>
                                )}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="border border-gray-300 px-2 py-1 text-center">
                        <input
                          type="radio"
                          name="aula-radio"
                          checked={checked}
                          onChange={() => setAulaSeleccionada(aulas.find(x => x.id === aula.id) || null)}
                          onClick={(e) => {
                            if (checked) {
                              // Evita que el radio permanezca seleccionado
                              e.preventDefault();
                              setAulaSeleccionada(null);
                            }
                          }}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Lista de docentes (para seleccionar hasta 2) */}
          <div className="border rounded-lg p-4 shadow-sm">
            <h3 className="text-lg font-semibold mb-2">Docentes</h3>
            <table className="w-full border-collapse border border-gray-300 text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-gray-300 px-2 py-1">Nombre</th>
                  <th className="border border-gray-300 px-2 py-1 text-center">Seleccionar</th>
                </tr>
              </thead>
              <tbody>
                {docentes.map((doc) => {
                  const selected = seleccionDocentes.includes(doc.id);
                  return (
                    <tr key={doc.id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-2 py-1">{doc.nombre}</td>
                      <td className="border border-gray-300 px-2 py-1 text-center">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleDocente(doc.id)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="mt-4 text-sm text-gray-600">
              Seleccionados: {seleccionDocentes.length} / 2
            </div>
          </div>
        </div>
      )}

      {/* Botón Asignar */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleAsignar}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          disabled={!aulaSeleccionada || seleccionDocentes.length === 0}
        >
          Asignar Tutor
        </button>
      </div>
    </div>
  );
}
