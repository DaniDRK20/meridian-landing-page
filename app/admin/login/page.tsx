import { redirect } from "next/navigation";
import Link from "next/link";
import { getAdminSession } from "@/lib/admin-session";
import { LoginForm } from "./login-form";
import "../workspace.css";

export default async function AdminLoginPage() {
  if (await getAdminSession()) redirect("/admin");
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || (process.env.NODE_ENV !== "production" ? "1x00000000000000000000AA" : "");
  return <main className="admin-login-page">
    <section className="admin-login-card">
      <Link className="admin-brand" href="/"><img src="/meridian-globe-transparent.png" alt="" /><span>Meridian</span></Link>
      <span className="admin-eyebrow">Acceso privado</span>
      <h1>Meridian Workspace</h1>
      <p>Gestiona el producto, el sprint y el trabajo del equipo en un solo lugar.</p>
      {siteKey ? <LoginForm siteKey={siteKey} /> : <p className="admin-error">Turnstile no está configurado.</p>}
      <Link className="back-home" href="/">← Volver a la página principal</Link>
    </section>
  </main>;
}
