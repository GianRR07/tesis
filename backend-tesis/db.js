// backend-tesis/db.js
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import dotenv from "dotenv";

dotenv.config();

export async function openDb() {
  const db = await open({
    filename: process.env.DB_PATH || "./database.db",
    driver: sqlite3.Database,
  });
  await db.exec("PRAGMA foreign_keys = ON;");
  return db;
}
