import { readFile } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";

const file = process.argv[2];
if (!file) throw new Error("Indica el archivo de migración.");
if (!process.env.DATABASE_URL) throw new Error("Configura DATABASE_URL.");
const sql = neon(process.env.DATABASE_URL);
const source = await readFile(file, "utf8");
const statements = source.split(";").map(value => value.trim()).filter(Boolean);
for (const statement of statements) await sql.query(statement);
console.log(`Migración aplicada: ${file} (${statements.length} sentencias)`);
