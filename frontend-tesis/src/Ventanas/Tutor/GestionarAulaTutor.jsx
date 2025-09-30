import React from "react";
import styles from "./Tutor.module.css";

export default function GestionarAulaTutor() {
  return (
    <div className={styles["content-container"]}>
      <h2 className={styles["title"]}>Registro de estudiantes</h2>
      
      <div className={styles["form-container"]}>
        {/* Campo para los nombres */}
        <label className={styles["label"]}>
          Nombre completo de los alumnos:
          <textarea
            placeholder="Ejem:
Valentina Ramírez Torres
Diego Fernández López
Camila Soto Martínez"
            className={styles["textarea"]}
          />
        </label>

        {/* Nota */}
        <p className={styles["note"]}>
          Nota: Para registrar un alumno correctamente asegúrese de usar un salto de línea por curso.
        </p>

        {/* Botón */}
        <div className={styles["button-container"]}>
          <button className={styles["btn-primary"]}>
            Registrar estudiantes
          </button>
        </div>
      </div>
    </div>
  );
}
