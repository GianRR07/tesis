import React, { useState } from "react";
import styles from "../../styles/Panel.module.css";

import ListaEstudiantesDocente from "./ListaEstudiantesDocente";
import EvaluarExamenDocente from "./EvaluarExamenDocente";

export default function DocenteOpciones() {
  const [active, setActive] = useState("inicio");

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <h1>Opciones de Docente</h1>
      </header>

      {/* Layout */}
      <div className={styles.layout}>
        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <button
            className={`${styles.sidebarBtn} ${active === "estudiantes" ? styles.active : ""}`}
            onClick={() => setActive("estudiantes")}
          >
            Lista de estudiantes
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
              <h2>Bienvenido Docente</h2>
              <p>Seleccione una opción del menú lateral</p>
            </div>
          )}

          {active === "estudiantes" && <ListaEstudiantesDocente />}
          {active === "evaluar" && <EvaluarExamenDocente />}
        </main>
      </div>
    </div>
  );
}
