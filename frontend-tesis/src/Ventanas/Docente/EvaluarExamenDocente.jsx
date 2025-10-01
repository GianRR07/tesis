import React, { useState } from "react";
import styles from "../../styles/Panel.module.css";

export default function EvaluarExamenDocente() {
  const [salon, setSalon] = useState("");
  const [alumno, setAlumno] = useState("");
  const [examenBase, setExamenBase] = useState("");

  const salones = ["Aula 1", "Aula 2", "Aula 3"];
  const alumnos = ["Carlos Pérez", "María Gómez", "Ana Torres"];
  const examenes = ["Examen Matemáticas", "Examen Lengua", "Examen Historia"];

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Evaluar Examen</h2>

      <div className={styles.formGroup}>
        <label>Seleccione el salón que deseas evaluar</label>
        <select
          className={styles.select}
          value={salon}
          onChange={(e) => setSalon(e.target.value)}
        >
          <option value="">Seleccione un salón</option>
          {salones.map((s, i) => (
            <option key={i} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className={styles.formGroup}>
        <label>Seleccione al alumno que se evaluará</label>
        <select
          className={styles.select}
          value={alumno}
          onChange={(e) => setAlumno(e.target.value)}
        >
          <option value="">Seleccione un alumno</option>
          {alumnos.map((a, i) => (
            <option key={i} value={a}>{a}</option>
          ))}
        </select>
      </div>

      <div className={styles.formGroup}>
        <label>Seleccione el examen base</label>
        <select
          className={styles.select}
          value={examenBase}
          onChange={(e) => setExamenBase(e.target.value)}
        >
          <option value="">Seleccione un examen</option>
          {examenes.map((ex, i) => (
            <option key={i} value={ex}>{ex}</option>
          ))}
        </select>
      </div>

      <div className={styles.formGroup}>
        <label>Cargue el examen del alumno</label>
        <input type="file" accept=".pdf,.png,.jpg" className={styles.fileInput} />
      </div>

      <button className={styles.evalBtn}>Realizar evaluación</button>
    </div>
  );
}
