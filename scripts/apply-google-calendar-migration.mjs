import {readFile} from "node:fs/promises";
import {neon} from "@neondatabase/serverless";
const sql=neon(process.env.DATABASE_URL),source=await readFile(new URL("../migrations/0004_google_calendar.sql",import.meta.url),"utf8");
for(const statement of source.split(";").map(value=>value.trim()).filter(Boolean))await sql.query(statement);
console.log("Google Calendar schema ready.");
