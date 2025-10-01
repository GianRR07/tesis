import React, { useState } from "react";
import styles from "../../styles/Panel.module.css";
import { FaChartLine } from "react-icons/fa";

export default function ListaEstudiantesDocente() {
  const aulas = ["Aula 1", "Aula 2", "Aula 3"];

  const estudiantesPorAula = {
    "Aula 1": ["Carlos Pérez", "María Gómez", "Ana Torres"],
    "Aula 2": ["Luis Fernández", "Sofía Ríos", "Miguel Castro"],
    "Aula 3": ["Laura Ramírez", "Pedro López", "Valeria Sánchez"],
  };

  const [aulaSeleccionada, setAulaSeleccionada] = useState("");
  const estudiantes = aulaSeleccionada ? estudiantesPorAula[aulaSeleccionada] : [];

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Lista de estudiantes</h2>

      {/* Selección de aula */}
      <div className={styles.selector}>
        <label>Nombre del Aula:</label>
        <select
          value={aulaSeleccionada}
          onChange={(e) => setAulaSeleccionada(e.target.value)}
          className={styles.select}
        >
          <option value="">Seleccione un aula</option>
          {aulas.map((aula, index) => (
            <option key={index} value={aula}>
              {aula}
            </option>
          ))}
        </select>
      </div>

      {/* Tabla de estudiantes */}
      {aulaSeleccionada && (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Opciones</th>
            </tr>
          </thead>
          <tbody>
            {estudiantes.map((est, index) => (
              <tr key={index}>
                <td>{est}</td>
                <td>
                  <button className={styles.metricsBtn}>
                    <FaChartLine /> Ver métricas de rendimiento
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
