import React, { useState } from "react";
import { getTutorAulaIdPreferida } from "../../utils/session";

export default function GestionarAulaTutor() {
  const [texto, setTexto] = useState("");
  const [ok, setOk] = useState("");
  const [err, setErr] = useState("");

  const aulaId = getTutorAulaIdPreferida();

  async function registrar() {
    setOk("");
    setErr("");

    if (!aulaId) {
      setErr("No se pudo identificar el aula asignada al tutor.");
      return;
    }
    if (!texto.trim()) {
      setErr("Ingrese al menos un nombre (uno por línea).");
      return;
    }

    try {
      // ENDPOINT PROPUESTO:
      // POST  /aulas/:aulaId/estudiantes/bulk
      // body: { lista: "Nombre 1\nNombre 2\n..." }
      const res = await fetch(`${import.meta.env.VITE_API_URL}/aulas/${aulaId}/estudiantes/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lista: texto }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "No se pudo registrar estudiantes.");

      setOk(`Se registraron ${data.inserted || 0} estudiantes.`);
      setTexto("");
    } catch (e) {
      setErr(e.message);
    }
  }

  return (
    <div className="bg-white shadow-md rounded-lg p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-[#004d8f] mb-4">
        Registro de estudiantes
      </h2>

      {!aulaId && (
        <div className="mb-4 text-red-600">
          No se encontró un aula asignada para este tutor.
        </div>
      )}

      <div>
        <label className="block font-medium text-gray-700 mb-2">
          Nombre completo de los alumnos:
        </label>
        <textarea
          placeholder={`Ejem:\nValentina Ramírez Torres\nDiego Fernández López\nCamila Soto Martínez`}
          className="w-full border border-gray-300 rounded-lg p-3 mb-4 h-40 focus:ring-2 focus:ring-[#004d8f]"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />

        <p className="text-sm text-gray-600 mb-4">
          Nota: Un salto de línea por estudiante.
        </p>

        <div className="text-center">
          <button
            className="bg-[#004d8f] text-white px-6 py-2 rounded-full font-semibold hover:bg-blue-900 transition"
            onClick={registrar}
          >
            Registrar estudiantes
          </button>
        </div>

        {ok && <div className="mt-3 text-green-700">{ok}</div>}
        {err && <div className="mt-3 text-red-700">{err}</div>}
      </div>
    </div>
  );
}
