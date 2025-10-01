import React, { useState } from "react";
import styles from "../../styles/Panel.module.css";

export default function ListaAulas() {
  // Datos simulados
  const [aulas, setAulas] = useState([
    { id: 1, nombre: "1° Primaria - A", grado: "1°", seccion: "A", tutor: "Luis Cabrera" },
    { id: 2, nombre: "2° Primaria - B", grado: "2°", seccion: "B", tutor: "Ana Torres" },
    { id: 3, nombre: "3° Primaria - C", grado: "3°", seccion: "C", tutor: "Miguel Fonsi" },
  ]);

  const handleEditar = (id) => {
    alert(`Editar aula con ID: ${id}`);
    // Aquí podrías abrir un modal con los datos del aula
  };

  const handleEliminar = (id) => {
    if (window.confirm("¿Seguro que quieres eliminar este aula?")) {
      setAulas(aulas.filter((aula) => aula.id !== id));
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Lista de Aulas</h2>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Grado</th>
            <th>Sección</th>
            <th>Tutor</th>
            <th>Opciones</th>
          </tr>
        </thead>
        <tbody>
          {aulas.map((aula) => (
            <tr key={aula.id}>
              <td>{aula.nombre}</td>
              <td>{aula.grado}</td>
              <td>{aula.seccion}</td>
              <td>{aula.tutor}</td>
              <td className={styles.opciones}>
                <button
                  className={styles.btnEditar}
                  onClick={() => handleEditar(aula.id)}
                >
                  ✏️ Editar
                </button>
                <button
                  className={styles.btnEliminar}
                  onClick={() => handleEliminar(aula.id)}
                >
                  🗑️ Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
