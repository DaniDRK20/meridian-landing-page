import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-session";
import { ablyRest, ABLY_CHANNEL } from "@/lib/ably";

export async function GET() {
  const user = await getAdminSession();
  if (!user) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const ably = ablyRest();
  if (!ably) return NextResponse.json({ error: "Ably no está configurado." }, { status: 503 });
  const tokenRequest = await ably.auth.createTokenRequest({
    clientId: user.id,
    capability: JSON.stringify({ [ABLY_CHANNEL]: ["subscribe", "presence"] }),
    ttl: 60 * 60 * 1000,
  });
  return NextResponse.json(tokenRequest);
}
