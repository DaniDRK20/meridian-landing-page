import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/admin-db";
import { getAdminSession } from "@/lib/admin-session";

export async function GET() {
  const user = await getAdminSession();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const sql = adminDb();
  const members = await sql`
    select u.id,u.name,u.email,
      case when p.last_seen_at < now() - interval '50 seconds' then 'offline' else p.state end state,
      case when p.typing_at >= now() - interval '4 seconds' then p.typing_channel else null end typing_channel
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
  if (Object.prototype.hasOwnProperty.call(data, "typingChannel")) {
    const typingChannel = typeof data.typingChannel === "string" && data.typingChannel ? data.typingChannel : null;
    await sql`insert into workspace_presence(user_id,state,last_seen_at,typing_channel,typing_at) values(${user.id},${state},now(),${typingChannel},now()) on conflict(user_id) do update set state=excluded.state,last_seen_at=now(),typing_channel=excluded.typing_channel,typing_at=now()`;
  } else {
    await sql`insert into workspace_presence(user_id,state,last_seen_at) values(${user.id},${state},now()) on conflict(user_id) do update set state=excluded.state,last_seen_at=now()`;
  }
  return NextResponse.json({ ok: true });
}
