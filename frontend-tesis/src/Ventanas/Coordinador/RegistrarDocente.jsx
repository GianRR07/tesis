import React, { useState } from "react";

export default function RegistrarDocente() {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [correoIngreso, setCorreoIngreso] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [cursos, setCursos] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones simples en cliente
    if (!nombre || !correo || !correoIngreso || !contrasena) {
      alert("Completa los campos obligatorios: Nombre, Correo, Correo de ingreso y Contraseña.");
      return;
    }

    try {
      const res = await fetch(import.meta.env.VITE_API_URL + "/docentes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          correo,             // correo de contacto
          telefono,
          correoIngreso,      // usuario para login
          contrasena,         // texto plano; el backend lo hashea
          cursos              // textarea con saltos de línea
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }

      // Éxito
      setNombre("");
      setCorreo("");
      setTelefono("");
      setCorreoIngreso("");
      setContrasena("");
      setCursos("");
      alert("Docente registrado correctamente.");
    } catch (err) {
      console.error(err);
      alert("Error al registrar docente: " + err.message);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-[#004d8f]">
        Registro de Docente
      </h2>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {/* Columna izquierda */}
        <div className="space-y-4">
          <label className="block">
            <span className="font-medium text-gray-700">Nombre del docente:</span>
            <input
              type="text"
              placeholder="Ej: Miguel Fonsi"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="mt-1 w-full p-2 border rounded-md focus:ring focus:ring-blue-300"
            />
          </label>

          <label className="block">
            <span className="font-medium text-gray-700">Correo:</span>
            <input
              type="email"
              placeholder="Ej: miguelfonsiEDU@gmail.com"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              className="mt-1 w-full p-2 border rounded-md focus:ring focus:ring-blue-300"
            />
          </label>

          <label className="block">
            <span className="font-medium text-gray-700">Teléfono:</span>
            <input
              type="tel"
              placeholder="Ej: 999888777"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className="mt-1 w-full p-2 border rounded-md focus:ring focus:ring-blue-300"
            />
          </label>

          <hr className="my-4" />

          <h3 className="text-lg font-semibold text-[#004d8f]">
            Acceso a la plataforma
          </h3>

          <label className="block">
            <span className="font-medium text-gray-700">Correo de ingreso:</span>
            <input
              type="email"
              placeholder="Ej: mfonsi@algo.pe"
              value={correoIngreso}
              onChange={(e) => setCorreoIngreso(e.target.value)}
              className="mt-1 w-full p-2 border rounded-md focus:ring focus:ring-blue-300"
            />
          </label>

          <label className="block">
            <span className="font-medium text-gray-700">Contraseña:</span>
            <div className="flex gap-2">
              <input
                type={mostrarContrasena ? "text" : "password"}
                placeholder="Ej: ****"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                className="mt-1 w-full p-2 border rounded-md focus:ring focus:ring-blue-300"
              />
              <button
                type="button"
                className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                onClick={() => setMostrarContrasena(!mostrarContrasena)}
              >
                {mostrarContrasena ? "Ocultar" : "Ver"}
              </button>
            </div>
          </label>
        </div>

        {/* Columna derecha */}
        <div className="space-y-4">
          <label className="block">
            <span className="font-medium text-gray-700">Cursos que enseña:</span>
            <textarea
              placeholder={"Ej: Matemática\nComunicación\nBiología"}
              value={cursos}
              onChange={(e) => setCursos(e.target.value)}
              className="mt-1 w-full p-2 border rounded-md focus:ring focus:ring-blue-300 h-40 resize-none"
            />
          </label>
          <p className="text-sm text-gray-500">
            Nota: Use un salto de línea por curso.
          </p>
        </div>

        {/* Footer */}
        <div className="md:col-span-2 flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 bg-[#004d8f] text-white rounded-lg hover:bg-blue-700 transition"
          >
            Registrar Docente
          </button>
        </div>
      </form>
    </div>
  );
}
