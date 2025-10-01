import React, { useState } from "react";

// Importamos los componentes de cada opción
import RegistrarCurso from "./RegistrarCurso";
import RegistrarDocente from "./RegistrarDocente";
import AsignarTutor from "./AsignarTutor";
import ListaAulas from "./ListaAulas";
import ListaDocentes from "./ListaDocentes";

export default function OpcionesCoordinador() {
  const [active, setActive] = useState("inicio");

  return (
    <div className="flex flex-col min-h-screen w-full">
      {/* Header */}
      <header className="bg-[#004d8f] text-white text-center py-4 text-lg font-bold">
        Opciones de Coordinador
      </header>

      {/* Layout */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-56 bg-[#004d8f] p-4 flex flex-col justify-between">
          <div className="flex flex-col space-y-3">
            <button
              className={`py-2 px-4 rounded-full font-bold transition ${
                active === "registrarCurso"
                  ? "bg-gray-300 text-[#004d8f]"
                  : "bg-white text-[#004d8f] hover:bg-gray-200"
              }`}
              onClick={() => setActive("registrarCurso")}
            >
              Registrar Curso
            </button>

            <button
              className={`py-2 px-4 rounded-full font-bold transition ${
                active === "registrarDocente"
                  ? "bg-gray-300 text-[#004d8f]"
                  : "bg-white text-[#004d8f] hover:bg-gray-200"
              }`}
              onClick={() => setActive("registrarDocente")}
            >
              Registrar Docente
            </button>

            <button
              className={`py-2 px-4 rounded-full font-bold transition ${
                active === "asignarTutor"
                  ? "bg-gray-300 text-[#004d8f]"
                  : "bg-white text-[#004d8f] hover:bg-gray-200"
              }`}
              onClick={() => setActive("asignarTutor")}
            >
              Asignar Tutor
            </button>

            <button
              className={`py-2 px-4 rounded-full font-bold transition ${
                active === "listaAulas"
                  ? "bg-gray-300 text-[#004d8f]"
                  : "bg-white text-[#004d8f] hover:bg-gray-200"
              }`}
              onClick={() => setActive("listaAulas")}
            >
              Lista de aulas
            </button>

            <button
              className={`py-2 px-4 rounded-full font-bold transition ${
                active === "listaDocentes"
                  ? "bg-gray-300 text-[#004d8f]"
                  : "bg-white text-[#004d8f] hover:bg-gray-200"
              }`}
              onClick={() => setActive("listaDocentes")}
            >
              Lista de docentes
            </button>
          </div>

          <button className="w-full mt-6 bg-red-100 text-red-600 font-bold rounded-full py-2 hover:bg-red-200 transition">
            Cerrar Sesión
          </button>
        </aside>

        {/* Contenido principal */}
        <main className="flex-1 bg-gray-50 p-6">
          {active === "inicio" && (
            <div className="text-center text-gray-600 mt-10">
              <h2 className="text-2xl font-bold text-[#004d8f]">
                Bienvenido Coordinador
              </h2>
              <p className="mt-2">Seleccione una opción del menú lateral</p>
            </div>
          )}

          {active === "registrarCurso" && <RegistrarCurso />}
          {active === "registrarDocente" && <RegistrarDocente />}
          {active === "asignarTutor" && <AsignarTutor />}
          {active === "listaAulas" && <ListaAulas />}
          {active === "listaDocentes" && <ListaDocentes />}
        </main>
      </div>
    </div>
  );
}
