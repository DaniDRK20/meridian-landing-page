import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

const args = Object.fromEntries(process.argv.slice(2).map(value => value.replace(/^--/, "").split("=")));
if (!process.env.DATABASE_URL) throw new Error("Configura DATABASE_URL");
const rl = createInterface({ input: stdin, output: stdout });
const name = args.name || await rl.question("Nombre: ");
const email = (args.email || await rl.question("Correo: ")).trim().toLowerCase();
const password = process.env.ADMIN_SEED_PASSWORD || await rl.question("Contraseña (mínimo 12 caracteres): ");
rl.close();
if (!name || !/^\S+@\S+\.\S+$/.test(email) || password.length < 12) throw new Error("Datos inválidos");
const hash = await bcrypt.hash(password, 12);
const sql = neon(process.env.DATABASE_URL);
await sql`insert into admin_users (name, email, password_hash) values (${name}, ${email}, ${hash}) on conflict (email) do update set name = excluded.name, password_hash = excluded.password_hash, is_active = true, updated_at = now()`;
console.log(`Administrador ${email} creado/actualizado.`);
