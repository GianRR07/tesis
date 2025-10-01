import React, { useState } from "react";

export default function ListaAulas() {
  const [aulas, setAulas] = useState([
    { id: 1, nombre: "1° Primaria - A", grado: "1°", seccion: "A", tutor: "Luis Cabrera" },
    { id: 2, nombre: "2° Primaria - B", grado: "2°", seccion: "B", tutor: "Ana Torres" },
    { id: 3, nombre: "3° Primaria - C", grado: "3°", seccion: "C", tutor: "Miguel Fonsi" },
  ]);

  const handleEditar = (id) => {
    alert(`Editar aula con ID: ${id}`);
  };

  const handleEliminar = (id) => {
    if (window.confirm("¿Seguro que quieres eliminar este aula?")) {
      setAulas(aulas.filter((aula) => aula.id !== id));
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-700">Lista de Aulas</h2>

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
          {aulas.map((aula) => (
            <tr key={aula.id} className="hover:bg-gray-50">
              <td className="border px-3 py-2">{aula.nombre}</td>
              <td className="border px-3 py-2">{aula.grado}</td>
              <td className="border px-3 py-2">{aula.seccion}</td>
              <td className="border px-3 py-2">{aula.tutor}</td>
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
          ))}
        </tbody>
      </table>
    </div>
  );
}
