// backend-tesis/migrate.js
import fs from "fs";
import path from "path";
import { openDb } from "./db.js";

async function ensureAulasDocentesTutores(db) {
  // ¿Existe la tabla puente?
  const row = await db.get(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='aulas_docentes_tutores'"
  );
  if (row) {
    console.log("ℹ️ Tabla aulas_docentes_tutores ya existe.");
    return;
  }

  console.log("🛠️ Creando tabla aulas_docentes_tutores...");
  await db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS aulas_docentes_tutores (
      aula_id     INTEGER NOT NULL,
      docente_id  INTEGER NOT NULL,
      PRIMARY KEY (aula_id, docente_id),
      FOREIGN KEY (aula_id)    REFERENCES aulas(id)    ON DELETE CASCADE,
      FOREIGN KEY (docente_id) REFERENCES docentes(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_adt_aula ON aulas_docentes_tutores(aula_id);
  `);
  console.log("✅ Tabla aulas_docentes_tutores creada.");
}


export async function migrateIfNeeded() {
  const db = await openDb();

  // ¿Existe la tabla 'docentes'?
  const row = await db.get(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='docentes'"
  );

  if (!row) {
    // Ejecuta schema.sql si no existen tablas
    const schemaPath = path.resolve(process.cwd(), "schema.sql");
    const sql = fs.readFileSync(schemaPath, "utf-8");
    await db.exec(sql);
    console.log("✅ schema.sql ejecutado. Base creada/actualizada.");
    await ensureAulasDocentesTutores(db);

  } else {
    // Opcional: podrías agregar comprobaciones de columnas, etc.
    console.log("ℹ️ Tablas existentes. No se ejecutó schema.sql.");
    await ensureAulasDocentesTutores(db);

  }
}


