import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import RoleSelectModal from "./RoleSelectModal";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [selectOpen, setSelectOpen] = useState(false);
  const [rolesInfo, setRolesInfo] = useState(null); 

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
      if (!res.ok) throw new Error(data?.message || "Credenciales inválidas");

      
      localStorage.setItem("session", JSON.stringify(data));

      
      const esDocente = !!data?.roles?.docente;
      const esTutor = !!data?.roles?.tutor;

      
      if (esDocente) {
        const docenteId =
          data.roles.docente.id ?? data.roles.docente.docente_id ?? null;
        if (docenteId) {
          localStorage.setItem("docente_id", docenteId);
          console.log("🧑‍🏫 Guardado docente_id:", docenteId);
        }
      }

      if (esTutor) {
        const tutorId =
          data.roles.tutor.id ?? data.roles.tutor.tutor_id ?? null;
        if (tutorId) {
          localStorage.setItem("tutor_id", tutorId);
          console.log("👨‍🏫 Guardado tutor_id:", tutorId);
        }
      }

      
      const aulaTutor = data?.roles?.tutor?.aulas?.[0]?.id ?? null;
      if (aulaTutor) {
        localStorage.setItem("tutor_aula_id", aulaTutor);
        console.log("🏫 Guardado aula del tutor:", aulaTutor);
      }

      
      if (data.userType === "coordinador") {
        navigate("/coordinador");
        return;
      }

      
      if (esDocente && esTutor) {
        setRolesInfo(data.roles);
        setSelectOpen(true);
        return;
      }

      if (esTutor) {
        navigate("/tutor");
        return;
      }

      if (esDocente) {
        navigate("/docente");
        return;
      }

      alert("Ingreso correcto, pero el usuario no tiene rol asignado aún.");
      navigate("/");

    } catch (e) {
      console.error("❌ Error al iniciar sesión:", e);
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#004d8f] min-h-screen w-full flex justify-center items-center">
      <div className="bg-white rounded-xl shadow-xl flex flex-col md:flex-row w-[700px] max-w-[90%] overflow-hidden">
        <div className="flex flex-col justify-center items-center p-10 md:w-1/2 bg-white">
          <h1 className="text-[#004d8f] text-4xl font-bold">EVALUATEPE</h1>
          <p className="text-gray-700 mt-3 text-center">
            Sistema de evaluación y predicción de notas
          </p>
        </div>

        <div className="flex flex-col justify-center p-10 md:w-1/2 bg-gray-50">
          <h2 className="text-[#004d8f] text-2xl font-semibold mb-6">
            Iniciar sesión
          </h2>

          {err && <div className="mb-3 text-red-600 text-sm">{err}</div>}

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
