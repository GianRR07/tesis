import React, { useEffect } from "react";

export default function RoleSelectModal({ open, onClose, onSelect }) {
  // Cerrar con ESC
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose?.();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Fondo */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Contenido */}
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-[95%] max-w-md rounded-2xl bg-white p-6 shadow-xl"
      >
        <h2 className="text-xl font-bold text-[#004d8f]">¡Bienvenido!</h2>
        <p className="mt-1 text-gray-700">¿Deseas ingresar como:</p>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            onClick={() => onSelect?.("docente")}
            className="rounded-xl border border-[#004d8f] px-5 py-3 font-semibold text-[#004d8f] hover:bg-[#004d8f] hover:text-white transition"
          >
            Docente
          </button>
          <button
            onClick={() => onSelect?.("tutor")}
            className="rounded-xl border border-[#004d8f] px-5 py-3 font-semibold text-[#004d8f] hover:bg-[#004d8f] hover:text-white transition"
          >
            Tutor
          </button>
        </div>

        <div className="mt-4 text-right">
          <button
            onClick={onClose}
            className="rounded-full px-4 py-2 text-sm text-gray-500 hover:bg-gray-100"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
