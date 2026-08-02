import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/admin-db";
import { getAdminSession } from "@/lib/admin-session";

export async function GET() {
  const user = await getAdminSession();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const sql = adminDb();
  const members = await sql`
    select u.id,u.name,u.email,
      case when p.last_seen_at < now() - interval '50 seconds' then 'offline' else p.state end state
    from admin_users u
    left join workspace_presence p on p.user_id=u.id
    where u.is_active=true and p.last_seen_at >= now() - interval '2 minutes'
    order by u.name
  `;
  return NextResponse.json({ ok: true, members });
}

export async function POST(request: NextRequest) {
  const user = await getAdminSession();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const data = await request.json().catch(() => ({}));
  const state = data.state === "away" ? "away" : "active";
  const sql = adminDb();
  await sql`insert into workspace_presence(user_id,state,last_seen_at) values(${user.id},${state},now()) on conflict(user_id) do update set state=excluded.state,last_seen_at=now()`;
  return NextResponse.json({ ok: true });
}
