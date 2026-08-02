import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("las rutas administrativas verifican sesión en servidor", async () => {
  const layout = await readFile("app/admin/(workspace)/layout.tsx", "utf8");
  assert.match(layout, /getAdminSession/);
  assert.match(layout, /redirect\("\/admin\/login"\)/);
});

test("el login valida Turnstile y usa mensajes genéricos", async () => {
  const route = await readFile("app/api/admin/login/route.ts", "utf8");
  assert.match(route, /verifyTurnstile/);
  assert.match(route, /Correo o contraseña incorrectos/);
  assert.doesNotMatch(route, /localStorage|sessionStorage/);
});

test("las sesiones son HttpOnly y se invalidan en servidor", async () => {
  const session = await readFile("lib/admin-session.ts", "utf8");
  assert.match(session, /httpOnly: true/);
  assert.match(session, /delete from admin_sessions/);
});
