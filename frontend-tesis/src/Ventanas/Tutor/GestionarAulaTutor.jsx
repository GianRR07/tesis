import React from "react";

export default function GestionarAulaTutor() {
  return (
    <div className="bg-white shadow-md rounded-lg p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-[#004d8f] mb-4">
        Registro de estudiantes
      </h2>

      <div>
        {/* Campo para los nombres */}
        <label className="block font-medium text-gray-700 mb-2">
          Nombre completo de los alumnos:
        </label>
        <textarea
          placeholder={`Ejem:\nValentina Ramírez Torres\nDiego Fernández López\nCamila Soto Martínez`}
          className="w-full border border-gray-300 rounded-lg p-3 mb-4 h-40 focus:ring-2 focus:ring-[#004d8f]"
        />

        {/* Nota */}
        <p className="text-sm text-gray-600 mb-4">
          Nota: Para registrar un alumno correctamente asegúrese de usar un salto
          de línea por estudiante.
        </p>

        {/* Botón */}
        <div className="text-center">
          <button className="bg-[#004d8f] text-white px-6 py-2 rounded-full font-semibold hover:bg-blue-900 transition">
            Registrar estudiantes
          </button>
        </div>
      </div>
    </div>
  );
}
