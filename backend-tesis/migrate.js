/*
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
*/


import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import { openDb } from "./db.js";

export async function migrateIfNeeded() {
  const db = await openDb();

  // Verificar si ya existen tablas
  const row = await db.get(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='docentes'"
  );

  if (!row) {
    // Si no hay tablas, ejecuta schema.sql
    const schemaPath = path.resolve("schema.sql");
    const sql = fs.readFileSync(schemaPath, "utf-8");
    await db.exec(sql);
    console.log("✅ schema.sql ejecutado. Base creada/actualizada.");
  } else {
    console.log("ℹ️ Tablas existentes. Ejecutando migraciones adicionales...");
    await runExtraMigrations();
  }
}

async function runExtraMigrations() {
  const dir = path.resolve("./migrations"); // ruta segura y directa

  if (!fs.existsSync(dir)) {
    console.log("⚠️ No se encontró la carpeta de migraciones.");
    return;
  }

  const files = fs.readdirSync(dir).filter(f => f.endsWith(".js"));
  for (const file of files) {
    const filePath = path.join(dir, file);
    const fileUrl = pathToFileURL(filePath).href;
    const { up } = await import(fileUrl);
    console.log(`⏳ Ejecutando migración: ${file}`);
    await up();
  }

  console.log("✅ Migraciones ejecutadas correctamente.");
}

