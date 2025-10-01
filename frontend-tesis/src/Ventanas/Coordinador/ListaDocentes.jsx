import React, { useState } from "react";
import styles from "../../styles/Panel.module.css";

export default function ListaDocentes() {
  // Datos simulados
  const [docentes, setDocentes] = useState([
    {
      id: 1,
      nombre: "Luis Cabrera",
      especialidad: "Matemática",
      correo: "luis.cabrera@colegio.edu",
      aulaTutor: "1° Primaria - A",
    },
    {
      id: 2,
      nombre: "Ana Torres",
      especialidad: "Comunicación",
      correo: "ana.torres@colegio.edu",
      aulaTutor: "2° Primaria - B",
    },
    {
      id: 3,
      nombre: "Miguel Fonsi",
      especialidad: "Ciencias",
      correo: "miguel.fonsi@colegio.edu",
      aulaTutor: "3° Primaria - C",
    },
  ]);

  const handleEditar = (id) => {
    alert(`Editar docente con ID: ${id}`);
    // Aquí luego podrías abrir un modal de edición
  };

  const handleEliminar = (id) => {
    if (window.confirm("¿Seguro que quieres eliminar este docente?")) {
      setDocentes(docentes.filter((doc) => doc.id !== id));
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Lista de Docentes</h2>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Especialidad</th>
            <th>Correo</th>
            <th>Aula / Tutor</th>
            <th>Opciones</th>
          </tr>
        </thead>
        <tbody>
          {docentes.map((doc) => (
            <tr key={doc.id}>
              <td>{doc.nombre}</td>
              <td>{doc.especialidad}</td>
              <td>{doc.correo}</td>
              <td>{doc.aulaTutor}</td>
              <td className={styles.opciones}>
                <button
                  className={styles.btnEditar}
                  onClick={() => handleEditar(doc.id)}
                >
                  ✏️ Editar
                </button>
                <button
                  className={styles.btnEliminar}
                  onClick={() => handleEliminar(doc.id)}
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
