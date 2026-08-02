import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("la landing conserva su contenido principal y formulario", async () => {
  const page = await readFile("app/page.tsx", "utf8");
  assert.match(page, /Innovación al servicio del/);
  assert.match(page, /Agendar una conversación/);
  assert.match(page, /\/api\/contact/);
});

test("la navbar incorpora acceso administrativo responsive", async () => {
  const page = await readFile("app/page.tsx", "utf8");
  const styles = await readFile("app/globals.css", "utf8");
  assert.match(page, /Acceso administrativo/);
  assert.match(page, /\/admin\/login/);
  assert.match(styles, /mobile-nav/);
});
