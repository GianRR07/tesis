import React, { useState } from "react";
import styles from "./Opciones-Tutor.module.css";

// Importamos las subpantallas del tutor
import GestionarAulaTutor from "./GestionarAulaTutor";
import ListaEstudiantes from "./ListaEstudiantes";
import GestionExamen from "./GestionExamen";
import EvaluarExamen from "./EvaluarExamen";


export default function OpcionesTutor() {
  const [active, setActive] = useState("inicio");

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <h1>Opciones de Tutor</h1>
      </header>

      {/* Layout */}
      <div className={styles.layout}>
        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <button
            className={`${styles.sidebarBtn} ${active === "aula" ? styles.active : ""}`}
            onClick={() => setActive("aula")}
          >
            Gestionar aula
          </button>
          <button
            className={`${styles.sidebarBtn} ${active === "estudiantes" ? styles.active : ""}`}
            onClick={() => setActive("estudiantes")}
          >
            Lista de estudiantes
          </button>
          <button
            className={`${styles.sidebarBtn} ${active === "examen" ? styles.active : ""}`}
            onClick={() => setActive("examen")}
          >
            Gestión de Examen
          </button>
          <button
            className={`${styles.sidebarBtn} ${active === "evaluar" ? styles.active : ""}`}
            onClick={() => setActive("evaluar")}
          >
            Evaluar Examen
          </button>

          <div className={styles.sidebarBottom}>
            <button className={styles.logoutBtn}>Cerrar Sesión</button>
          </div>
        </aside>

        {/* Contenido principal */}
        <main className={styles.content}>
          {active === "inicio" && (
            <div className={styles.welcome}>
              <h2>Bienvenido Tutor</h2>
              <p>Seleccione una opción del menú lateral</p>
            </div>
          )}

          {active === "aula" && <GestionarAulaTutor />}
          {active === "estudiantes" && <ListaEstudiantes />}
          {active === "examen" && <GestionExamen />}
          {active === "evaluar" && <EvaluarExamen />}
        </main>
      </div>
    </div>
  );
}
