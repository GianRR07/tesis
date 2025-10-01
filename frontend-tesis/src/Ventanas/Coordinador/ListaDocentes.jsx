import React, { useState } from "react";

export default function ListaDocentes() {
  const [docentes, setDocentes] = useState([
    {
      id: 1,
      nombre: "Luis Cabrera",
      especialidad: "Matemática",
      correo: "luis.cabrera@colegio.edu",
      aulaTutor: "1° Primaria - A",
    },
    {
      id: 2,
      nombre: "Ana Torres",
      especialidad: "Comunicación",
      correo: "ana.torres@colegio.edu",
      aulaTutor: "2° Primaria - B",
    },
    {
      id: 3,
      nombre: "Miguel Fonsi",
      especialidad: "Ciencias",
      correo: "miguel.fonsi@colegio.edu",
      aulaTutor: "3° Primaria - C",
    },
  ]);

  const handleEditar = (id) => {
    alert(`Editar docente con ID: ${id}`);
  };

  const handleEliminar = (id) => {
    if (window.confirm("¿Seguro que quieres eliminar este docente?")) {
      setDocentes(docentes.filter((doc) => doc.id !== id));
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-700">Lista de Docentes</h2>

      <table className="w-full border-collapse border border-gray-300 text-sm">
        <thead className="bg-blue-300">
          <tr>
            <th className="border px-3 py-2">Nombre</th>
            <th className="border px-3 py-2">Especialidad</th>
            <th className="border px-3 py-2">Correo</th>
            <th className="border px-3 py-2">Aula / Tutor</th>
            <th className="border px-3 py-2">Opciones</th>
          </tr>
        </thead>
        <tbody>
          {docentes.map((doc) => (
            <tr key={doc.id} className="hover:bg-gray-50">
              <td className="border px-3 py-2">{doc.nombre}</td>
              <td className="border px-3 py-2">{doc.especialidad}</td>
              <td className="border px-3 py-2">{doc.correo}</td>
              <td className="border px-3 py-2">{doc.aulaTutor}</td>
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
          ))}
        </tbody>
      </table>
    </div>
  );
}
