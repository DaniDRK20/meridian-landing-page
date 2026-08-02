import { getAdminSession } from "@/lib/admin-session";

export async function GET() {
  const session = await getAdminSession();
  return Response.json({ authenticated: Boolean(session) }, { headers: { "Cache-Control": "no-store" } });
}
