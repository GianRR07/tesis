import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import RoleSelectModal from "./RoleSelectModal";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [err,   setErr] = useState("");

  // NUEVO: control del modal de selección de rol
  const [selectOpen, setSelectOpen] = useState(false);

  const handleLogin = async () => {
    setErr("");
    if (!email || !pass) {
      setErr("Ingrese correo y contraseña");
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(import.meta.env.VITE_API_URL + "/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pass }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Credenciales inválidas");
      }

      // Guarda sesión simple en localStorage (puedes cambiarlo por JWT luego)
      localStorage.setItem("session", JSON.stringify(data));

      // Redirección según roles
      if (data.userType === "coordinador") {
        navigate("/coordinador");
        return;
      }

      const tieneDocente = data?.roles?.docente?.aulas?.length > 0;
      const tieneTutor   = data?.roles?.tutor?.aulas?.length > 0;

      if (tieneDocente && tieneTutor) {
        // Mostrar modal con botones Docente/Tutor
        setSelectOpen(true);
        return;
      } else if (tieneTutor) {
        navigate("/tutor");
      } else if (tieneDocente) {
        navigate("/docente");
      } else {
        alert("Ingreso correcto, pero no tienes aulas asignadas aún.");
        navigate("/");
      }
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

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

          {err && <div className="mb-3 text-red-600 text-sm">{err}</div>}

          {/* Inputs */}
          <input
            type="email"
            placeholder="Ingrese su correo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="px-4 py-2 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004d8f]"
          />
          <input
            type="password"
            placeholder="Ingrese su contraseña"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            className="px-4 py-2 mb-6 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004d8f]"
          />

          {/* Botón único */}
          <button
            className="bg-[#004d8f] text-white py-2 rounded-lg mb-3 hover:bg-blue-900 transition disabled:opacity-60"
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>

          <button className="border border-[#004d8f] text-[#004d8f] py-2 rounded-lg hover:bg-[#004d8f] hover:text-white transition">
            Contáctanos
          </button>

          {/* Modal para elegir rol cuando tiene Docente y Tutor */}
          <RoleSelectModal
            open={selectOpen}
            onClose={() => setSelectOpen(false)}
            onSelect={(role) => {
              setSelectOpen(false);
              if (role === "docente") navigate("/docente");
              else if (role === "tutor") navigate("/tutor");
            }}
          />
        </div>
      </div>
    </div>
  );
}
