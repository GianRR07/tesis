import React, { useState } from "react";
import styles from "./Tutor.module.css";

export default function EvaluarExamen() {
  const [alumno, setAlumno] = useState("");
  const [examenBase, setExamenBase] = useState("");
  const [archivoAlumno, setArchivoAlumno] = useState(null);

  // Listas simuladas (en el futuro vendrán de la BD)
  const alumnos = ["Valentina Ramírez", "Diego Fernández", "Camila Soto"];
  const examenes = ["Examen Matemáticas", "Examen Comunicación", "Examen Biología"];

  const handleFileChange = (e) => {
    setArchivoAlumno(e.target.files[0]);
  };

  const handleEvaluar = () => {
    if (!alumno || !examenBase || !archivoAlumno) {
      alert("Debe seleccionar un alumno, un examen base y cargar un archivo.");
      return;
    }
    alert(
      `Evaluando a ${alumno} con el examen base "${examenBase}". Archivo: ${archivoAlumno.name}`
    );
  };

  return (
    <div className={styles["content-container"]}>
      <h2 className={styles["title"]}>Evaluar Examen</h2>

      {/* Selección de alumno */}
      <label className={styles["label"]}>Seleccione al alumno que se evaluará:</label>
      <select
        value={alumno}
        onChange={(e) => setAlumno(e.target.value)}
        className={styles["input"]}
      >
        <option value="">-- Seleccione un alumno --</option>
        {alumnos.map((a, index) => (
          <option key={index} value={a}>
            {a}
          </option>
        ))}
      </select>

      {/* Selección de examen base */}
      <label className={styles["label"]}>Seleccione el examen base:</label>
      <select
        value={examenBase}
        onChange={(e) => setExamenBase(e.target.value)}
        className={styles["input"]}
      >
        <option value="">-- Seleccione un examen --</option>
        {examenes.map((ex, index) => (
          <option key={index} value={ex}>
            {ex}
          </option>
        ))}
      </select>

      {/* Subida del examen del alumno */}
      <label className={styles["label"]}>Cargue el examen del alumno:</label>
      <input
        type="file"
        accept=".pdf,image/*"
        onChange={handleFileChange}
        className={styles["file-input"]}
      />

      {/* Botón de evaluar */}
      <div className={styles["button-container"]}>
        <button onClick={handleEvaluar} className={styles["btn-primary"]}>
          Realizar evaluación
        </button>
      </div>
    </div>
  );
}
