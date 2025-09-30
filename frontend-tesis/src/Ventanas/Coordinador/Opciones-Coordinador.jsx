import React from "react";
import { Link, Outlet } from "react-router-dom";
import styles from "./Opciones-Coordinador.module.css";

export default function OpcionesCoordinador() {
  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <h1>Opciones de Coordinador</h1>
      </header>

      {/* Layout con sidebar y contenido */}
      <div className={styles.main}>
        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <Link to="aulas" className={styles.btn}>Gestionar Aula</Link>
          <Link to="registrar-curso" className={styles.btn}>Registrar Curso</Link>
          <Link to="registrar-docente" className={styles.btn}>Registrar Docente</Link>
          <Link to="asignar-tutor" className={styles.btn}>Asignar Tutor</Link>
          <Link to="lista-aulas" className={styles.btn}>Lista de Aulas</Link>
          <Link to="lista-docentes" className={styles.btn}>Lista de Docentes</Link>
          <Link to="/" className={`${styles.btn} ${styles.logout}`}>Cerrar Sesión</Link>
        </aside>

        {/* Contenido dinámico */}
        <section className={styles.content}>
          <Outlet /> {/* Aquí se cargan las subpantallas */}
        </section>
      </div>
    </div>
  );
}
