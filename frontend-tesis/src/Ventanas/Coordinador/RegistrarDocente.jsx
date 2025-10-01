import React, { useState } from "react";
import styles from "../../styles/Panel.module.css";

export default function RegistrarDocente() {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [correoIngreso, setCorreoIngreso] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [cursos, setCursos] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Datos del docente:", {
      nombre,
      correo,
      telefono,
      correoIngreso,
      contrasena,
      cursos,
    });
    alert("Docente registrado (simulado).");
    // Aquí luego se enviará al backend
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Registro de Docente</h2>

      <form className={styles.form} onSubmit={handleSubmit}>
        {/* Columna izquierda */}
        <div className={styles.left}>
          <label>Nombre del Docente:</label>
          <input
            type="text"
            placeholder="Ejem: Miguel Fonsi"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />

          <label>Correo:</label>
          <input
            type="email"
            placeholder="Ejem: miguelfonsiEDU@gmail.com"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
          />

          <label>Teléfono:</label>
          <input
            type="tel"
            placeholder="Ejem: 999888777"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
          />

          <hr />

          <h3 className={styles.subtitle}>Acceso a la plataforma</h3>

          <label>Correo de ingreso:</label>
          <input
            type="email"
            placeholder="Ejem: mfonsi@algo.pe"
            value={correoIngreso}
            onChange={(e) => setCorreoIngreso(e.target.value)}
          />

          <label>Contraseña:</label>
          <div className={styles.passwordWrapper}>
            <input
              type={mostrarContrasena ? "text" : "password"}
              placeholder="Ejem: ****"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
            />
            <button
              type="button"
              className={styles.toggleBtn}
              onClick={() => setMostrarContrasena(!mostrarContrasena)}
            >
              {mostrarContrasena ? "Ocultar" : "Ver"}
            </button>
          </div>
        </div>

        {/* Columna derecha */}
        <div className={styles.right}>
          <label>Cursos que enseña:</label>
          <textarea
            placeholder="Ejem: Matemática&#10;Comunicación&#10;Biología"
            value={cursos}
            onChange={(e) => setCursos(e.target.value)}
          />
          <p className={styles.nota}>
            Nota: Para registrar el curso correctamente asegúrese de usar un
            salto de línea por curso.
          </p>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button type="submit" className={styles.btn}>
            Registrar Docente
          </button>
        </div>
      </form>
    </div>
  );
}
