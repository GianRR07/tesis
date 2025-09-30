import React from "react";
import styles from "./Tutor.module.css";
import { FaChartLine } from "react-icons/fa"; // icono de métricas

export default function ListaEstudiantes() {
  // Por ahora dejamos datos simulados
  const estudiantes = [
    "Valentina Ramírez Torres",
    "Diego Fernández López",
    "Camila Soto Martínez",
    "Luis Alberto Gutiérrez",
    "María Fernanda Díaz",
    "Andrés Felipe Morales",
  ];

  return (
    <div className={styles["content-container"]}>
      <h2 className={styles["title"]}>Lista de estudiantes</h2>

      <table className={styles["table"]}>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Opciones</th>
          </tr>
        </thead>
        <tbody>
          {estudiantes.map((estudiante, index) => (
            <tr key={index}>
              <td>{estudiante}</td>
              <td>
                <button className={styles["btn-metricas"]}>
                  <FaChartLine className={styles["icon"]} /> Ver métricas de rendimiento
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
