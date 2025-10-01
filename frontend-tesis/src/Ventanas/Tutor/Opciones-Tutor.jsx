import React, { useState } from "react";
import GestionarAulaTutor from "./GestionarAulaTutor";
import ListaEstudiantes from "./ListaEstudiantes";
import GestionExamen from "./GestionExamen";
import EvaluarExamen from "./EvaluarExamen";

export default function OpcionesTutor() {
  const [active, setActive] = useState("inicio");

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-[#004d8f] text-white p-4 text-center font-bold text-xl">
        Opciones de Tutor
      </header>

      {/* Layout */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-56 bg-[#004d8f] p-4 flex flex-col justify-between">
          <div className="space-y-2">
            <button
              className={`w-full rounded-full px-4 py-2 font-semibold transition ${
                active === "aula"
                  ? "bg-gray-300 text-[#004d8f]"
                  : "bg-white text-[#004d8f] hover:bg-gray-200"
              }`}
              onClick={() => setActive("aula")}
            >
              Gestionar aula
            </button>
            <button
              className={`w-full rounded-full px-4 py-2 font-semibold transition ${
                active === "estudiantes"
                  ? "bg-gray-300 text-[#004d8f]"
                  : "bg-white text-[#004d8f] hover:bg-gray-200"
              }`}
              onClick={() => setActive("estudiantes")}
            >
              Lista de estudiantes
            </button>
            <button
              className={`w-full rounded-full px-4 py-2 font-semibold transition ${
                active === "examen"
                  ? "bg-gray-300 text-[#004d8f]"
                  : "bg-white text-[#004d8f] hover:bg-gray-200"
              }`}
              onClick={() => setActive("examen")}
            >
              Gestión de Examen
            </button>
            <button
              className={`w-full rounded-full px-4 py-2 font-semibold transition ${
                active === "evaluar"
                  ? "bg-gray-300 text-[#004d8f]"
                  : "bg-white text-[#004d8f] hover:bg-gray-200"
              }`}
              onClick={() => setActive("evaluar")}
            >
              Evaluar Examen
            </button>
          </div>

          {/* Botón de logout */}
          <button className="w-full rounded-full px-4 py-2 font-semibold bg-white text-red-600 hover:bg-red-100 transition">
            Cerrar Sesión
          </button>
        </aside>

        {/* Contenido principal */}
        <main className="flex-1 bg-[#f5f9ff] p-6 overflow-auto">
          {active === "inicio" && (
            <div className="bg-white shadow-md rounded-lg p-6 text-center max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold text-[#004d8f] mb-2">
                Bienvenido Tutor
              </h2>
              <p className="text-gray-600">
                Seleccione una opción del menú lateral
              </p>
            </div>
          )}

          {active === "aula" && <GestionarAulaTutor />}
          {active === "estudiantes" && <ListaEstudiantes />}
          {active === "examen" && <GestionExamen />}
          {active === "evaluar" && <EvaluarExamen />}
        </main>
      </div>
    </div>
  );
}
