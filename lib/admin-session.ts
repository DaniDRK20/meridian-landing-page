import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { adminDb } from "./admin-db";

export const SESSION_COOKIE = "meridian_admin_session";
const SESSION_DAYS = 7;

const digest = (token: string) => createHash("sha256").update(token).digest("hex");

export async function createAdminSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = digest(token);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400000);
  const sql = adminDb();
  await sql`insert into admin_sessions (user_id, token_hash, expires_at) values (${userId}, ${tokenHash}, ${expiresAt.toISOString()})`;
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function getAdminSession() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || !process.env.DATABASE_URL) return null;
  const sql = adminDb();
  const rows = await sql`
    select u.id, u.name, u.email, u.role
    from admin_sessions s
    join admin_users u on u.id = s.user_id
    where s.token_hash = ${digest(token)} and s.expires_at > now() and u.is_active = true
    limit 1
  `;
  return rows[0] as { id: string; name: string; email: string; role: string } | undefined ?? null;
}

export async function destroyAdminSession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token && process.env.DATABASE_URL) {
    const sql = adminDb();
    await sql`delete from admin_sessions where token_hash = ${digest(token)}`;
  }
  jar.delete(SESSION_COOKIE);
}
