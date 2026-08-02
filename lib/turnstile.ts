export async function verifyTurnstile(token: string, ip?: string | null) {
  const secret = process.env.TURNSTILE_SECRET_KEY || (process.env.NODE_ENV !== "production" ? "1x0000000000000000000000000000000AA" : "");
  if (!secret || !token) return false;
  const body = new URLSearchParams({ secret, response: token });
  if (ip) body.set("remoteip", ip);
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body, cache: "no-store" });
  const result = await response.json() as { success?: boolean };
  return response.ok && result.success === true;
}
