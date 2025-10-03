import React, { useEffect, useState } from "react";

export default function GestionarAula() {
  const [nombre, setNombre] = useState("");
  const [grado, setGrado] = useState("");
  const [seccion, setSeccion] = useState("");

  const [cursos, setCursos] = useState([]);     // [{id, nombre, docente_id}]
  const [docentes, setDocentes] = useState([]); // [{id, nombre}]
  const [seleccion, setSeleccion] = useState({}); // { [cursoId]: { checked: boolean } }
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    async function cargar() {
      try {
        setLoading(true);
        setErr("");
        const [rCursos, rDocentes] = await Promise.all([
          fetch(import.meta.env.VITE_API_URL + "/cursos"),
          fetch(import.meta.env.VITE_API_URL + "/docentes"),
        ]);
        if (!rCursos.ok) throw new Error("No se pudo obtener cursos");
        if (!rDocentes.ok) throw new Error("No se pudo obtener docentes");

        const dataCursos = await rCursos.json();
        const dataDocentes = await rDocentes.json();

        setCursos(dataCursos);
        setDocentes(dataDocentes.map(d => ({ id: d.id, nombre: d.nombre })));

        // base de selección (sin docente editable)
        const base = {};
        for (const c of dataCursos) base[c.id] = { checked: false };
        setSeleccion(base);
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    }
    cargar();
  }, []);

  const toggleCurso = (cursoId) => {
    setSeleccion(prev => ({
      ...prev,
      [cursoId]: { ...(prev[cursoId] || {}), checked: !(prev[cursoId]?.checked) }
    }));
  };



  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre || !grado || !seccion) {
      alert("Completa nombre, grado y sección");
      return;
    }

    // Construir payload de cursos seleccionados
    const cursosSeleccionados = cursos
      .filter(c => seleccion[c.id]?.checked)
      .map(c => c.id);
    if (cursosSeleccionados.some(id => !Number.isInteger(Number(id)))) {
      alert("Hay un curso seleccionado con ID inválido.");
      return;
    }
    // Opcional: ver en consola lo que se envía
    console.log("Payload aulas:", { nombre, grado, seccion, cursos: cursosSeleccionados });

    try {
      const res = await fetch(import.meta.env.VITE_API_URL + "/aulas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          grado,
          seccion,
          cursos: cursosSeleccionados,
        }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || "No se pudo registrar el aula");
      }
      setNombre("");
      setGrado("");
      setSeccion("");

      // reconstruye la base de selección (todas desmarcadas)
      setSeleccion(Object.fromEntries(cursos.map(c => [c.id, { checked: false }])));

      alert("Aula registrada correctamente.");
    } catch (e) {
      alert("Error al registrar: " + e.message);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-700">Registro de aulas</h2>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Columna izquierda */}
        <div className="space-y-4">
          <label className="block">
            <span className="font-medium">Nombre de aula:</span>
            <input
              type="text"
              placeholder="Ejem: Salón 1° primaria - A"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="mt-1 w-full p-2 border rounded-md focus:ring focus:ring-blue-300"
            />
          </label>

          <label className="block">
            <span className="font-medium">Grado:</span>
            <input
              type="text"
              placeholder="Ejem: 1° de primaria"
              value={grado}
              onChange={(e) => setGrado(e.target.value)}
              className="mt-1 w-full p-2 border rounded-md focus:ring focus:ring-blue-300"
            />
          </label>

          <label className="block">
            <span className="font-medium">Sección:</span>
            <input
              type="text"
              placeholder="Ejem: A"
              value={seccion}
              onChange={(e) => setSeccion(e.target.value)}
              className="mt-1 w-full p-2 border rounded-md focus:ring focus:ring-blue-300"
            />
          </label>
        </div>

        {/* Columna derecha: lista de cursos (2 columnas: Curso y Docente asignado — solo lectura) */}
        <div className="space-y-4">
          <span className="font-medium">Cursos del aula:</span>

          {loading ? (
            <p className="text-gray-500">Cargando cursos/docentes...</p>
          ) : err ? (
            <p className="text-red-600">Error: {err}</p>
          ) : (
            <div className="border rounded-md">
              <div className="grid grid-cols-12 bg-gray-100 px-3 py-2 font-semibold text-sm">
                <div className="col-span-1"></div>
                <div className="col-span-7">Curso</div>
                <div className="col-span-4">Docente asignado</div>
              </div>

              <div className="max-h-64 overflow-auto">
                {cursos.map((c) => {
                  const sel = seleccion[c.id] || { checked: false };
                  const docenteNombre =
                    (c.docente_id &&
                      (docentes.find(d => d.id === c.docente_id)?.nombre || "—")) ||
                    "—";

                  return (
                    <div key={c.id} className="grid grid-cols-12 items-center px-3 py-2 border-t text-sm">
                      <div className="col-span-1">
                        <input
                          type="checkbox"
                          checked={!!sel.checked}
                          onChange={() =>
                            setSeleccion(prev => ({
                              ...prev,
                              [c.id]: { checked: !(prev[c.id]?.checked) }
                            }))
                          }
                        />
                      </div>
                      <div className="col-span-7">{c.nombre}</div>
                      <div className="col-span-4">
                        <span className="inline-block px-2 py-1 text-xs rounded bg-gray-100 border">
                          {docenteNombre}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>


        {/* Footer */}
        <div className="md:col-span-2 flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Registrar aula
          </button>
        </div>
      </form>
    </div>
  );
}
