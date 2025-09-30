import React, { useState } from "react";
import styles from "./Tutor.module.css";
import { FaTrash, FaEdit, FaDownload, FaUpload } from "react-icons/fa";

export default function GestionExamen() {
  const [examenes, setExamenes] = useState([
    { id: 1, nombre: "Examen Matemáticas" },
    { id: 2, nombre: "Examen Comunicación" },
    { id: 3, nombre: "Examen Biología" },
  ]);

  const [archivo, setArchivo] = useState(null);

  // Simulación de carga de archivo
  const handleFileChange = (e) => {
    setArchivo(e.target.files[0]);
  };

  const handleUpload = () => {
    if (archivo) {
      const nuevoExamen = {
        id: examenes.length + 1,
        nombre: archivo.name,
      };
      setExamenes([...examenes, nuevoExamen]);
      setArchivo(null);
    }
  };

  const handleDelete = (id) => {
    setExamenes(examenes.filter((examen) => examen.id !== id));
  };

  return (
    <div className={styles["content-container"]}>
      <h2 className={styles["title"]}>Cargar Examen</h2>

      {/* Subida de archivo */}
      <div className={styles["upload-box"]}>
        <input
          type="file"
          accept=".pdf,image/*"
          onChange={handleFileChange}
          className={styles["file-input"]}
        />
        <button
          className={styles["btn-upload"]}
          onClick={handleUpload}
          disabled={!archivo}
        >
          <FaUpload /> Cargar Archivo
        </button>
      </div>

      <h3 className={styles["subtitle"]}>Exámenes cargados</h3>

      {/* Tabla de examenes */}
      <table className={styles["table"]}>
        <thead>
          <tr>
            <th>Examen</th>
            <th>Editar</th>
            <th>Eliminar</th>
            <th>Descargar</th>
          </tr>
        </thead>
        <tbody>
          {examenes.map((examen) => (
            <tr key={examen.id}>
              <td>{examen.nombre}</td>
              <td>
                <button className={styles["btn-icon"]}>
                  <FaEdit />
                </button>
              </td>
              <td>
                <button
                  className={styles["btn-icon"]}
                  onClick={() => handleDelete(examen.id)}
                >
                  <FaTrash />
                </button>
              </td>
              <td>
                <button className={styles["btn-icon"]}>
                  <FaDownload />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
