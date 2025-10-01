import React, { useState } from "react";
import { FaTrash, FaEdit, FaDownload, FaUpload } from "react-icons/fa";

export default function GestionExamen() {
  const [examenes, setExamenes] = useState([
    { id: 1, nombre: "Examen Matemáticas" },
    { id: 2, nombre: "Examen Comunicación" },
    { id: 3, nombre: "Examen Biología" },
  ]);
  const [archivo, setArchivo] = useState(null);

  const handleFileChange = (e) => setArchivo(e.target.files[0]);

  const handleUpload = () => {
    if (archivo) {
      const nuevo = { id: examenes.length + 1, nombre: archivo.name };
      setExamenes([...examenes, nuevo]);
      setArchivo(null);
    }
  };

  const handleDelete = (id) => {
    setExamenes(examenes.filter((ex) => ex.id !== id));
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-2xl font-bold text-[#004d8f] mb-4">
        Cargar Examen
      </h2>

      {/* Subida de archivo */}
      <div className="flex gap-3 mb-6">
        <input
          type="file"
          accept=".pdf,image/*"
          onChange={handleFileChange}
          className="border p-2 rounded-lg flex-1"
        />
        <button
          onClick={handleUpload}
          disabled={!archivo}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white transition ${
            archivo
              ? "bg-[#004d8f] hover:bg-blue-900"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          <FaUpload /> Cargar Archivo
        </button>
      </div>

      <h3 className="text-lg font-semibold text-gray-700 mb-3">
        Exámenes cargados
      </h3>

      <table className="w-full border border-gray-300 rounded-lg overflow-hidden">
        <thead className="bg-[#004d8f] text-white">
          <tr>
            <th className="p-2 text-left">Examen</th>
            <th className="p-2">Editar</th>
            <th className="p-2">Eliminar</th>
            <th className="p-2">Descargar</th>
          </tr>
        </thead>
        <tbody>
          {examenes.map((ex) => (
            <tr
              key={ex.id}
              className="border-b hover:bg-gray-100 transition cursor-pointer"
            >
              <td className="p-2">{ex.nombre}</td>
              <td className="p-2 text-center">
                <button className="text-blue-600 hover:text-blue-900">
                  <FaEdit />
                </button>
              </td>
              <td className="p-2 text-center">
                <button
                  className="text-red-600 hover:text-red-800"
                  onClick={() => handleDelete(ex.id)}
                >
                  <FaTrash />
                </button>
              </td>
              <td className="p-2 text-center">
                <button className="text-green-600 hover:text-green-800">
                  <FaDownload />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
