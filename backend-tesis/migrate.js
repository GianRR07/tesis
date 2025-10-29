// backend-tesis/migrate.js
import fs from "fs";
import path from "path";
import { openDb } from "./db.js";

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
  } else {
    console.log("ℹ️ Tablas existentes. No se ejecutó schema.sql.");
  }
}
