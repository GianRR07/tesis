import React, { useState } from "react";
import styles from "../../styles/Panel.module.css";

export default function RegistrarCurso() {
  const [nombreCurso, setNombreCurso] = useState("");
  const [docente, setDocente] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Datos del curso:", { nombreCurso, docente });
    alert("Curso registrado (simulado, falta backend).");
    // Aquí luego se enviará al backend
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Registro de curso</h2>

      <form className={styles.form} onSubmit={handleSubmit}>
        {/* Nombre del curso */}
        <div className={styles.left}>
          <label>Nombre del curso:</label>
          <input
            type="text"
            placeholder="Ejem: Matemáticas"
            value={nombreCurso}
            onChange={(e) => setNombreCurso(e.target.value)}
          />

          <label>Docente:</label>
          <select
            value={docente}
            onChange={(e) => setDocente(e.target.value)}
          >
            <option value="">-- Seleccione un docente --</option>
            {/* Aquí luego se cargarán los docentes desde la BD */}
            <option value="luis_cabrera">Luis Cabrera</option>
            <option value="ana_garcia">Ana García</option>
            <option value="juan_perez">Juan Pérez</option>
          </select>
        </div>

        {/* Botón */}
        <div className={styles.footer}>
          <button type="submit" className={styles.btn}>
            Registrar Curso
          </button>
        </div>
      </form>
    </div>
  );
}
