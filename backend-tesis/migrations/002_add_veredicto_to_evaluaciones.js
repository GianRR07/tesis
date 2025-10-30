import { openDb } from "../db.js";

export async function up() {
  const db = await openDb();

  // Verificamos si la columna ya existe (por si ya fue ejecutada antes)
  const info = await db.all(`PRAGMA table_info(evaluaciones);`);
  const existe = info.some(col => col.name === "veredicto");

  if (!existe) {
    await db.run(`ALTER TABLE evaluaciones ADD COLUMN veredicto TEXT;`);
    console.log("🟢 Migración: columna 'veredicto' añadida en evaluaciones.");
  } else {
    console.log("⚪ Columna 'veredicto' ya existía, no se aplicó migración.");
  }
}
