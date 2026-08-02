import bcrypt from "bcryptjs";
import { adminDb, type AdminUser } from "@/lib/admin-db";
import { createAdminSession } from "@/lib/admin-session";
import { verifyTurnstile } from "@/lib/turnstile";

const GENERIC_ERROR = "Correo o contraseña incorrectos.";
const DUMMY_HASH = "$2b$12$C6UzMDM.H6dfI/f/IKcEe.EDB0Q0jQhG4Nw4U1wQpQ.0s8QX2QbW";

export async function POST(request: Request) {
  try {
    const { email: rawEmail, password, turnstileToken } = await request.json();
    const email = String(rawEmail || "").trim().toLowerCase();
    if (!email || typeof password !== "string" || password.length < 10) return Response.json({ ok: false, error: GENERIC_ERROR }, { status: 401 });
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    if (!await verifyTurnstile(String(turnstileToken || ""), ip)) return Response.json({ ok: false, error: "No pudimos validar que eres una persona. Inténtalo nuevamente." }, { status: 400 });

    const sql = adminDb();
    const rows = await sql`select id, name, email, role, is_active, password_hash, failed_login_attempts, locked_until from admin_users where email = ${email} limit 1`;
    const user = rows[0] as AdminUser | undefined;
    const validPassword = await bcrypt.compare(password, user?.password_hash || DUMMY_HASH);
    const locked = user?.locked_until && new Date(user.locked_until) > new Date();
    if (!user || !user.is_active || locked || !validPassword) {
      if (user && user.is_active && !locked) {
        const attempts = user.failed_login_attempts + 1;
        const lockUntil = attempts >= 5 ? new Date(Date.now() + 15 * 60000).toISOString() : null;
        await sql`update admin_users set failed_login_attempts = ${attempts >= 5 ? 0 : attempts}, locked_until = ${lockUntil}, updated_at = now() where id = ${user.id}`;
      }
      return Response.json({ ok: false, error: GENERIC_ERROR }, { status: 401 });
    }
    await sql`update admin_users set failed_login_attempts = 0, locked_until = null, last_login_at = now(), updated_at = now() where id = ${user.id}`;
    await createAdminSession(user.id);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Admin login error", error);
    return Response.json({ ok: false, error: "No pudimos iniciar sesión en este momento." }, { status: 500 });
  }
}
