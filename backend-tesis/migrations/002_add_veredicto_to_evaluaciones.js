// migrate_add_tutor_id.js
import { openDb } from "../db.js";

export async function up() {
  const db = await openDb();

  // Obtenemos la info de columnas actuales
  const info = await db.all(`PRAGMA table_info(evaluaciones);`);

  // --- Columna veredicto ---
  const existeVeredicto = info.some(col => col.name === "veredicto");
  if (!existeVeredicto) {
    await db.run(`ALTER TABLE evaluaciones ADD COLUMN veredicto TEXT;`);
    console.log("🟢 Migración: columna 'veredicto' añadida en evaluaciones.");
  } else {
    console.log("⚪ Columna 'veredicto' ya existía, no se aplicó migración.");
  }

  // --- Columna docente_id ---
  const existeDocente = info.some(col => col.name === "docente_id");
  if (!existeDocente) {
    await db.run(`ALTER TABLE evaluaciones ADD COLUMN docente_id INTEGER;`);
    console.log("🟢 Migración: columna 'docente_id' añadida en evaluaciones.");
  } else {
    console.log("⚪ Columna 'docente_id' ya existía, no se aplicó migración.");
  }

  // --- Columna tutor_id ---
  const existeTutor = info.some(col => col.name === "tutor_id");
  if (!existeTutor) {
    await db.run(`ALTER TABLE evaluaciones ADD COLUMN tutor_id INTEGER;`);
    console.log("🟢 Migración: columna 'tutor_id' añadida en evaluaciones.");
  } else {
    console.log("⚪ Columna 'tutor_id' ya existía, no se aplicó migración.");
  }

  console.log("✅ Migración de evaluaciones completada correctamente.");
}
