import React from "react";
import styles from "./Login.module.css";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  return (
    <div className={styles["login-container"]}>
      <div className={styles["login-modal"]}>
        <div className={styles["login-left"]}>
          <h1>EVALUATEPE</h1>
          <p>Sistema de evaluación y predicción de notas</p>
        </div>

        <div className={styles["login-right"]}>
          <h2>Iniciar sesión</h2>
          <input
            type="email"
            placeholder="Ingrese su correo"
            className={styles["login-input"]}
          />
          <input
            type="password"
            placeholder="Ingrese su contraseña"
            className={styles["login-input"]}
          />

          {/* Botón con redirección */}
          <button
            className={styles["btn-ingresar"]}
            onClick={() => navigate("/tutor")}
          >
            Ingresar
          </button>

          <button className={styles["btn-contacto"]}>Contáctanos</button>
        </div>
      </div>
    </div>
  );
}
