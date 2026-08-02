import { neon } from "@neondatabase/serverless";

export function adminDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL no está configurada");
  return neon(url);
}

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  password_hash: string;
  failed_login_attempts: number;
  locked_until: string | null;
};
