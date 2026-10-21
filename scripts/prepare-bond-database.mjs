import nextEnv from "@next/env";
import { readFile } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";

// Match `next build`'s production environment-file loading.
nextEnv.loadEnvConfig(process.cwd(), false);
const url = process.env.BONDS_DATABASE_URL?.trim() || process.env.DATABASE_URL?.trim();
if (!url) {
  console.log("No database connected; preserving JSON owner access.");
} else if (process.env.BONDS_SKIP_DATABASE_MIGRATIONS === "1") {
  console.log("Database schema preparation skipped by configuration.");
} else {
  try {
    const schema = await readFile(new URL("../db/bonds-schema.sql", import.meta.url), "utf8");
    // This checked-in schema contains plain statements, without procedural
    // bodies or semicolons inside SQL strings. Apply the entire migration atomically.
    const statements = schema.split(";").map(statement => statement.trim()).filter(Boolean);
    const sql = neon(url);
    await sql.transaction([
      sql.query("SELECT pg_advisory_xact_lock(7256, 103)"),
      ...statements.map(statement => sql.query(statement)),
    ]);
    console.log("Bond database schema prepared. No portfolio JSON data was uploaded.");
  } catch (error) {
    const reasons = { "42501": "Database role lacks migration permissions.", "28P01": "Database credentials were rejected.", "3D000": "Database was not found." };
    console.error("Bond database preparation failed.", reasons[error?.code] || "Check the database connection and migration permissions. Raw database errors are not logged.");
    process.exitCode = 1;
  }
}
