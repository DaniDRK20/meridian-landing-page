import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/admin-db";
import { getAdminSession } from "@/lib/admin-session";

const bad = (message: string, status = 400) => NextResponse.json({ ok: false, error: message }, { status });
const text = (value: unknown, max = 5000) => String(value ?? "").trim().slice(0, max);
const number = (value: unknown, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

async function authorized() { return getAdminSession(); }

export async function GET() {
  if (!await authorized()) return bad("No autorizado.", 401);
  const sql = adminDb();
  const [tasks, members, sprints, events, documents] = await Promise.all([
    sql`select t.*,m.name assignee_name,s.name sprint_name from workspace_tasks t left join workspace_members m on m.id=t.assignee_id left join workspace_sprints s on s.id=t.sprint_id order by t.created_at desc`,
    sql`select m.*,count(t.id)::int task_count,count(t.id) filter(where t.status='Completado')::int completed_count from workspace_members m left join workspace_tasks t on t.assignee_id=m.id group by m.id order by m.created_at`,
    sql`select s.*,count(t.id)::int task_count,count(t.id) filter(where t.status='Completado')::int completed_count,coalesce(sum(t.story_points),0)::int points from workspace_sprints s left join workspace_tasks t on t.sprint_id=s.id group by s.id order by s.starts_on desc`,
    sql`select * from workspace_events order by event_date,event_time nulls last`,
    sql`select * from workspace_documents order by updated_at desc`,
  ]);
  return NextResponse.json({ ok: true, tasks, members, sprints, events, documents });
}

export async function POST(request: NextRequest) {
  const user = await authorized(); if (!user) return bad("No autorizado.", 401);
  const data = await request.json(); const resource = text(data.resource, 30); const sql = adminDb();
  if (resource === "task") {
    const title = text(data.title, 220); if (!title) return bad("El título es obligatorio.");
    const sequence = await sql`select coalesce(max(substring(code from '[0-9]+$')::int),0)::int last_code from workspace_tasks`;
    const code = `RES-${String(Number(sequence[0].last_code) + 1).padStart(2,"0")}`;
    const rows = await sql`insert into workspace_tasks(code,title,description,status,priority,tag,story_points,progress,due_on,assignee_id,sprint_id,created_by) values(${code},${title},${text(data.description)},${text(data.status,40)||"Ideas"},${text(data.priority,20)||"Media"},${text(data.tag,80)||"Producto"},${number(data.story_points,1)},${number(data.progress)},${data.due_on||null},${data.assignee_id||null},${data.sprint_id||null},${user.id}) returning *`;
    return NextResponse.json({ ok:true,item:rows[0] },{status:201});
  }
  if (resource === "member") {
    if (!text(data.name,120) || !text(data.role,160)) return bad("Nombre y rol son obligatorios.");
    const rows=await sql`insert into workspace_members(name,role,email,availability,workload) values(${text(data.name,120)},${text(data.role,160)},${text(data.email,255)||null},${text(data.availability,40)||"Disponible"},${number(data.workload)}) returning *`;
    return NextResponse.json({ok:true,item:rows[0]},{status:201});
  }
  if (resource === "event") {
    if (!text(data.title,180)||!data.event_date) return bad("Título y fecha son obligatorios.");
    const rows=await sql`insert into workspace_events(title,event_date,event_time,kind,created_by) values(${text(data.title,180)},${data.event_date},${data.event_time||null},${text(data.kind,60)||"Evento"},${user.id}) returning *`;
    return NextResponse.json({ok:true,item:rows[0]},{status:201});
  }
  if (resource === "document") {
    if (!text(data.title,220)) return bad("El título es obligatorio.");
    const rows=await sql`insert into workspace_documents(title,category,content,created_by) values(${text(data.title,220)},${text(data.category,80)||"Notas"},${text(data.content,20000)},${user.id}) returning *`;
    return NextResponse.json({ok:true,item:rows[0]},{status:201});
  }
  if (resource === "sprint") {
    if (!text(data.name,120)||!data.starts_on||!data.ends_on) return bad("Nombre y fechas son obligatorios.");
    const rows=await sql`insert into workspace_sprints(name,goal,starts_on,ends_on,status) values(${text(data.name,120)},${text(data.goal)},${data.starts_on},${data.ends_on},${text(data.status,30)||"planned"}) returning *`;
    return NextResponse.json({ok:true,item:rows[0]},{status:201});
  }
  return bad("Recurso inválido.");
}

export async function PATCH(request: NextRequest) {
  if (!await authorized()) return bad("No autorizado.",401);
  const data=await request.json(); const resource=text(data.resource,30); const id=text(data.id,50); if(!id)return bad("ID obligatorio."); const sql=adminDb();
  if(resource==="task") { const rows=await sql`update workspace_tasks set title=${text(data.title,220)},description=${text(data.description)},status=${text(data.status,40)},priority=${text(data.priority,20)},tag=${text(data.tag,80)},story_points=${number(data.story_points,1)},progress=${number(data.progress)},due_on=${data.due_on||null},assignee_id=${data.assignee_id||null},sprint_id=${data.sprint_id||null},updated_at=now() where id=${id} returning *`; return NextResponse.json({ok:true,item:rows[0]}); }
  if(resource==="member") { const rows=await sql`update workspace_members set name=${text(data.name,120)},role=${text(data.role,160)},email=${text(data.email,255)||null},availability=${text(data.availability,40)},workload=${number(data.workload)} where id=${id} returning *`; return NextResponse.json({ok:true,item:rows[0]}); }
  if(resource==="event") { const rows=await sql`update workspace_events set title=${text(data.title,180)},event_date=${data.event_date},event_time=${data.event_time||null},kind=${text(data.kind,60)} where id=${id} returning *`; return NextResponse.json({ok:true,item:rows[0]}); }
  if(resource==="document") { const rows=await sql`update workspace_documents set title=${text(data.title,220)},category=${text(data.category,80)},content=${text(data.content,20000)},updated_at=now() where id=${id} returning *`; return NextResponse.json({ok:true,item:rows[0]}); }
  if(resource==="sprint") { const rows=await sql`update workspace_sprints set name=${text(data.name,120)},goal=${text(data.goal)},starts_on=${data.starts_on},ends_on=${data.ends_on},status=${text(data.status,30)} where id=${id} returning *`; return NextResponse.json({ok:true,item:rows[0]}); }
  return bad("Recurso inválido.");
}

export async function DELETE(request: NextRequest) {
  if (!await authorized()) return bad("No autorizado.",401);
  const data=await request.json(); const id=text(data.id,50); const sql=adminDb();
  if(data.resource==="task") await sql`delete from workspace_tasks where id=${id}`;
  else if(data.resource==="member") await sql`delete from workspace_members where id=${id}`;
  else if(data.resource==="event") await sql`delete from workspace_events where id=${id}`;
  else if(data.resource==="document") await sql`delete from workspace_documents where id=${id}`;
  else if(data.resource==="sprint") await sql`delete from workspace_sprints where id=${id}`;
  else return bad("Recurso inválido.");
  return NextResponse.json({ok:true});
}
