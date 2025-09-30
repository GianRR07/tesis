import React, { useState } from "react";
import styles from "./GestionarAula.module.css";

export default function GestionarAula() {
  // Estados para guardar los valores del formulario
  const [nombre, setNombre] = useState("");
  const [grado, setGrado] = useState("");
  const [seccion, setSeccion] = useState("");
  const [curso, setCurso] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Datos del aula:", { nombre, grado, seccion, curso });
    alert("Aula registrada (simulado, falta backend).");
    // Aquí luego se enviará al backend
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Registro de aulas</h2>

      <form className={styles.form} onSubmit={handleSubmit}>
        {/* Columna izquierda */}
        <div className={styles.left}>
          <label>Nombre de aula:</label>
          <input
            type="text"
            placeholder="Ejem: Salón 1° primaria - A"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />

          <label>Grado:</label>
          <input
            type="text"
            placeholder="Ejem: 1° de primaria"
            value={grado}
            onChange={(e) => setGrado(e.target.value)}
          />

          <label>Sección:</label>
          <input
            type="text"
            placeholder="Ejem: A"
            value={seccion}
            onChange={(e) => setSeccion(e.target.value)}
          />
        </div>

        {/* Columna derecha */}
        <div className={styles.right}>
          <label>Cursos del aula:</label>
          <select
            value={curso}
            onChange={(e) => setCurso(e.target.value)}
          >
            <option value="">-- Seleccione un curso --</option>
            {/* Aquí luego se mapearán cursos desde la BD */}
            <option value="matematicas">Matemáticas</option>
            <option value="comunicacion">Comunicación</option>
            <option value="ciencias">Ciencias</option>
          </select>
        </div>

        {/* Botón en esquina inferior derecha */}
        <div className={styles.footer}>
          <button type="submit" className={styles.btn}>
            Registrar aula
          </button>
        </div>
      </form>
    </div>
  );
}
