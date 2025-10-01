import React from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  return (
    <div className="bg-[#004d8f] min-h-screen w-full flex justify-center items-center">
      {/* Modal */}
      <div className="bg-white rounded-xl shadow-xl flex flex-col md:flex-row w-[700px] max-w-[90%] overflow-hidden">
        {/* Columna izquierda */}
        <div className="flex flex-col justify-center items-center p-10 md:w-1/2 bg-white">
          <h1 className="text-[#004d8f] text-4xl font-bold">EVALUATEPE</h1>
          <p className="text-gray-700 mt-3 text-center">
            Sistema de evaluación y predicción de notas
          </p>
        </div>

        {/* Columna derecha */}
        <div className="flex flex-col justify-center p-10 md:w-1/2 bg-gray-50">
          <h2 className="text-[#004d8f] text-2xl font-semibold mb-6">
            Iniciar sesión
          </h2>

          {/* Inputs */}
          <input
            type="email"
            placeholder="Ingrese su correo"
            className="px-4 py-2 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004d8f]"
          />
          <input
            type="password"
            placeholder="Ingrese su contraseña"
            className="px-4 py-2 mb-6 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004d8f]"
          />

          {/* Botones */}
          <button
            className="bg-[#004d8f] text-white py-2 rounded-lg mb-3 hover:bg-blue-900 transition"
            onClick={() => navigate("/coordinador")}
          >
            Ingresar como Coordinador
          </button>

          <button
            className="bg-[#004d8f] text-white py-2 rounded-lg mb-3 hover:bg-blue-900 transition"
            onClick={() => navigate("/tutor")}
          >
            Ingresar como Tutor
          </button>

          <button
            className="bg-[#004d8f] text-white py-2 rounded-lg mb-3 hover:bg-blue-900 transition"
            onClick={() => navigate("/docente")}
          >
            Ingresar como Docente
          </button>

          <button className="border border-[#004d8f] text-[#004d8f] py-2 rounded-lg hover:bg-[#004d8f] hover:text-white transition">
            Contáctanos
          </button>
        </div>
      </div>
    </div>
  );
}
