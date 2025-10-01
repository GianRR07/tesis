import React, { useState } from "react";
import styles from "../../styles/Panel.module.css";

export default function AsignarTutor() {
  // Datos simulados
  const aulasMock = [
    { id: 1, nombre: "1° Primaria - A", grado: "1°", seccion: "A" },
    { id: 2, nombre: "2° Primaria - B", grado: "2°", seccion: "B" },
  ];

  const docentesMock = [
    { id: 1, nombre: "Luis Cabrera" },
    { id: 2, nombre: "Ana Torres" },
    { id: 3, nombre: "Miguel Fonsi" },
  ];

  const [aulaSeleccionada, setAulaSeleccionada] = useState(null);
  const [docenteSeleccionado, setDocenteSeleccionado] = useState(null);

  const handleAsignar = () => {
    if (!aulaSeleccionada || !docenteSeleccionado) {
      alert("Debe seleccionar un aula y un docente.");
      return;
    }

    alert(
      `Tutor asignado:\n${docenteSeleccionado.nombre} → ${aulaSeleccionada.nombre}`
    );
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Asignar Tutor</h2>

      <div className={styles.content}>
        {/* Lista de aulas */}
        <div className={styles.box}>
          <h3>Aulas</h3>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Grado</th>
                <th>Sección</th>
              </tr>
            </thead>
            <tbody>
              {aulasMock.map((aula) => (
                <tr
                  key={aula.id}
                  className={
                    aulaSeleccionada?.id === aula.id ? styles.selected : ""
                  }
                  onClick={() => setAulaSeleccionada(aula)}
                >
                  <td>{aula.nombre}</td>
                  <td>{aula.grado}</td>
                  <td>{aula.seccion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Lista de docentes */}
        <div className={styles.box}>
          <h3>Docentes</h3>
          <ul className={styles.list}>
            {docentesMock.map((doc) => (
              <li
                key={doc.id}
                className={
                  docenteSeleccionado?.id === doc.id ? styles.selected : ""
                }
                onClick={() => setDocenteSeleccionado(doc)}
              >
                {doc.nombre}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Botón Asignar */}
      <div className={styles.footer}>
        <button className={styles.btn} onClick={handleAsignar}>
          Asignar Tutor
        </button>
      </div>
    </div>
  );
}
