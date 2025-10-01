import React, { useState } from "react";
import styles from "../../styles/Panel.module.css";

// Importamos los componentes de cada opción
import RegistrarCurso from "./RegistrarCurso";
import RegistrarDocente from "./RegistrarDocente";
import AsignarTutor from "./AsignarTutor";
import ListaAulas from "./ListaAulas";
import ListaDocentes from "./ListaDocentes";

export default function OpcionesCoordinador() {
  const [active, setActive] = useState("inicio");

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <h1>Opciones de Coordinador</h1>
      </header>

      {/* Layout */}
      <div className={styles.layout}>
        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <button
            className={`${styles.sidebarBtn} ${active === "registrarCurso" ? styles.active : ""}`}
            onClick={() => setActive("registrarCurso")}
          >
            Registrar Curso
          </button>
          <button
            className={`${styles.sidebarBtn} ${active === "registrarDocente" ? styles.active : ""}`}
            onClick={() => setActive("registrarDocente")}
          >
            Registrar Docente
          </button>
          <button
            className={`${styles.sidebarBtn} ${active === "asignarTutor" ? styles.active : ""}`}
            onClick={() => setActive("asignarTutor")}
          >
            Asignar Tutor
          </button>
          <button
            className={`${styles.sidebarBtn} ${active === "listaAulas" ? styles.active : ""}`}
            onClick={() => setActive("listaAulas")}
          >
            Lista de aulas
          </button>
          <button
            className={`${styles.sidebarBtn} ${active === "listaDocentes" ? styles.active : ""}`}
            onClick={() => setActive("listaDocentes")}
          >
            Lista de docentes
          </button>

          <div className={styles.sidebarBottom}>
            <button className={styles.logoutBtn}>Cerrar Sesión</button>
          </div>
        </aside>

        {/* Contenido principal */}
        <main className={styles.content}>
          {active === "inicio" && (
            <div className={styles.welcome}>
              <h2>Bienvenido Coordinador</h2>
              <p>Seleccione una opción del menú lateral</p>
            </div>
          )}

          {active === "registrarCurso" && <RegistrarCurso />}
          {active === "registrarDocente" && <RegistrarDocente />}
          {active === "asignarTutor" && <AsignarTutor />}
          {active === "listaAulas" && <ListaAulas />}
          {active === "listaDocentes" && <ListaDocentes />}
        </main>
      </div>
    </div>
  );
}
