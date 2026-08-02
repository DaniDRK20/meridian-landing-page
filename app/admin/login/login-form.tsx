"use client";

import Script from "next/script";
import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

declare global {
  interface Window { turnstile?: { render: (element: HTMLElement, options: Record<string, unknown>) => string; reset: (id?: string) => void } }
}

export function LoginForm({ siteKey }: { siteKey: string }) {
  const router = useRouter();
  const widgetRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | undefined>(undefined);
  const [token, setToken] = useState("");
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const renderTurnstile = () => {
    if (!window.turnstile || !widgetRef.current || widgetId.current) return;
    widgetId.current = window.turnstile.render(widgetRef.current, {
      sitekey: siteKey,
      theme: "light",
      callback: (value: string) => setToken(value),
      "expired-callback": () => setToken(""),
      "error-callback": () => setToken(""),
    });
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true); setError("");
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: data.get("email"), password: data.get("password"), turnstileToken: token }) });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "No pudimos iniciar sesión.");
      router.replace("/admin"); router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No pudimos iniciar sesión.");
      setToken(""); window.turnstile?.reset(widgetId.current);
    } finally { setLoading(false); }
  };

  return <>
    <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" onLoad={renderTurnstile} />
    <form className="admin-login-form" onSubmit={submit}>
      <label htmlFor="admin-email">Correo electrónico</label>
      <input id="admin-email" name="email" type="email" autoComplete="username" required />
      <label htmlFor="admin-password">Contraseña</label>
      <div className="password-field"><input id="admin-password" name="password" type={visible ? "text" : "password"} minLength={10} autoComplete="current-password" required /><button type="button" onClick={() => setVisible(value => !value)}>{visible ? "Ocultar" : "Mostrar"}</button></div>
      <div ref={widgetRef} className="turnstile-slot" aria-label="Verificación de seguridad" />
      {error && <p className="admin-error" role="alert">{error}</p>}
      <button className="admin-primary" type="submit" disabled={loading || !token}>{loading ? "Verificando…" : "Iniciar sesión"}</button>
    </form>
  </>;
}
