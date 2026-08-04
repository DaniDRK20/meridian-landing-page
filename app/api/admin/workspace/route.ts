import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/admin-db";
import { getAdminSession } from "@/lib/admin-session";
import { accessTokenFor, ensureGoogleCalendarSchema, googleConfigured } from "@/lib/google-calendar";

const bad = (message: string, status = 400) => NextResponse.json({ ok: false, error: message }, { status });
const text = (value: unknown, max = 5000) => String(value ?? "").trim().slice(0, max);
const number = (value: unknown, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const ids = (value: unknown) => Array.isArray(value) ? [...new Set(value.map(item => text(item, 50)).filter(Boolean))] : [];

async function syncTaskAssignees(sql:ReturnType<typeof adminDb>,taskId:string,value:unknown,fallback?:unknown){
  const assignees=ids(value);if(!assignees.length&&fallback)assignees.push(text(fallback,50));
  await sql`delete from workspace_task_assignees where task_id=${taskId}`;
  for(const memberId of assignees)await sql`insert into workspace_task_assignees(task_id,member_id) select ${taskId},id from workspace_members where id=${memberId} on conflict do nothing`;
  await sql`update workspace_tasks set assignee_id=${assignees[0]||null} where id=${taskId}`;
}

let taskAssigneeSchema:Promise<void>|null=null;
async function ensureTaskAssigneeSchema(sql:ReturnType<typeof adminDb>){
  if(!taskAssigneeSchema)taskAssigneeSchema=(async()=>{
    await sql`create table if not exists workspace_task_assignees(task_id uuid not null references workspace_tasks(id) on delete cascade,member_id uuid not null references workspace_members(id) on delete cascade,created_at timestamptz not null default now(),primary key(task_id,member_id))`;
    await sql`create index if not exists workspace_task_assignees_member_idx on workspace_task_assignees(member_id)`;
    await sql`insert into workspace_task_assignees(task_id,member_id) select id,assignee_id from workspace_tasks where assignee_id is not null on conflict do nothing`;
  })();
  await taskAssigneeSchema;
}

async function authorized() { return getAdminSession(); }

export async function GET() {
  if (!await authorized()) return bad("No autorizado.", 401);
  const sql = adminDb();
  await ensureTaskAssigneeSchema(sql);
  const [tasks, members, sprints, events, documents] = await Promise.all([
    sql`select t.*,coalesce(a.assignee_ids,'[]'::json) assignee_ids,coalesce(a.assignee_names,'[]'::json) assignee_names,a.assignee_name,s.name sprint_name from workspace_tasks t left join lateral(select json_agg(m.id order by ta.created_at) assignee_ids,json_agg(m.name order by ta.created_at) assignee_names,string_agg(m.name,', ' order by ta.created_at) assignee_name from workspace_task_assignees ta join workspace_members m on m.id=ta.member_id where ta.task_id=t.id)a on true left join workspace_sprints s on s.id=t.sprint_id order by t.created_at desc`,
    sql`select m.*,count(distinct ta.task_id)::int task_count,count(distinct ta.task_id) filter(where t.status='Completado')::int completed_count from workspace_members m left join workspace_task_assignees ta on ta.member_id=m.id left join workspace_tasks t on t.id=ta.task_id group by m.id order by m.created_at`,
    sql`select s.*,count(t.id)::int task_count,count(t.id) filter(where t.status='Completado')::int completed_count,coalesce(sum(t.story_points),0)::int points from workspace_sprints s left join workspace_tasks t on t.sprint_id=s.id group by s.id order by s.starts_on desc`,
    sql`select * from workspace_events order by event_date,event_time nulls last`,
    sql`select * from workspace_documents order by updated_at desc`,
  ]);
  return NextResponse.json({ ok: true, tasks, members, sprints, events, documents });
}

export async function POST(request: NextRequest) {
  const user = await authorized(); if (!user) return bad("No autorizado.", 401);
  const data = await request.json(); const resource = text(data.resource, 30); const sql = adminDb();await ensureTaskAssigneeSchema(sql);
  if (resource === "task") {
    const title = text(data.title, 220); if (!title) return bad("El título es obligatorio.");
    const sequence = await sql`select coalesce(max(substring(code from '[0-9]+$')::int),0)::int last_code from workspace_tasks`;
    const code = `RES-${String(Number(sequence[0].last_code) + 1).padStart(2,"0")}`;
    const rows = await sql`insert into workspace_tasks(code,title,description,status,priority,tag,story_points,progress,due_on,assignee_id,sprint_id,created_by) values(${code},${title},${text(data.description)},${text(data.status,40)||"Ideas"},${text(data.priority,20)||"Media"},${text(data.tag,80)||"Producto"},${number(data.story_points,1)},${number(data.progress)},${data.due_on||null},${null},${data.sprint_id||null},${user.id}) returning *`;
    await syncTaskAssignees(sql,String(rows[0].id),data.assignee_ids,data.assignee_id);
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
  const data=await request.json(); const resource=text(data.resource,30); const id=text(data.id,50); if(!id)return bad("ID obligatorio."); const sql=adminDb();await ensureTaskAssigneeSchema(sql);
  if(resource==="task") { const rows=await sql`update workspace_tasks set title=${text(data.title,220)},description=${text(data.description)},status=${text(data.status,40)},priority=${text(data.priority,20)},tag=${text(data.tag,80)},story_points=${number(data.story_points,1)},progress=${number(data.progress)},due_on=${data.due_on||null},sprint_id=${data.sprint_id||null},updated_at=now() where id=${id} returning *`; await syncTaskAssignees(sql,id,data.assignee_ids,data.assignee_id);return NextResponse.json({ok:true,item:rows[0]}); }
  if(resource==="member") { const rows=await sql`update workspace_members set name=${text(data.name,120)},role=${text(data.role,160)},email=${text(data.email,255)||null},availability=${text(data.availability,40)},workload=${number(data.workload)} where id=${id} returning *`; return NextResponse.json({ok:true,item:rows[0]}); }
  if(resource==="event") { const rows=await sql`update workspace_events set title=${text(data.title,180)},event_date=${data.event_date},event_time=${data.event_time||null},kind=${text(data.kind,60)} where id=${id} returning *`; return NextResponse.json({ok:true,item:rows[0]}); }
  if(resource==="document") { const rows=await sql`update workspace_documents set title=${text(data.title,220)},category=${text(data.category,80)},content=${text(data.content,20000)},updated_at=now() where id=${id} returning *`; return NextResponse.json({ok:true,item:rows[0]}); }
  if(resource==="sprint") { const rows=await sql`update workspace_sprints set name=${text(data.name,120)},goal=${text(data.goal)},starts_on=${data.starts_on},ends_on=${data.ends_on},status=${text(data.status,30)} where id=${id} returning *`; return NextResponse.json({ok:true,item:rows[0]}); }
  return bad("Recurso inválido.");
}

export async function DELETE(request: NextRequest) {
  if (!await authorized()) return bad("No autorizado.",401);
  const data=await request.json(); const id=text(data.id,50); const sql=adminDb();await ensureTaskAssigneeSchema(sql);
  if(data.resource==="task") await sql`delete from workspace_tasks where id=${id}`;
  else if(data.resource==="member") await sql`delete from workspace_members where id=${id}`;
  else if(data.resource==="event") {
    if(googleConfigured()){
      await ensureGoogleCalendarSchema();
      const links=await sql`select l.user_id,l.google_event_id from workspace_google_event_links l inner join workspace_google_calendar_connections c on c.user_id=l.user_id where l.workspace_event_id=${id}`;
      for(const link of links){
        try{
          const token=await accessTokenFor(String(link.user_id));
          const response=await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(String(link.google_event_id))}?sendUpdates=none`,{method:"DELETE",headers:{Authorization:`Bearer ${token}`}});
          if(!response.ok&&response.status!==404&&response.status!==410)throw new Error("Google Calendar rechazó la eliminación");
        }catch(reason){
          return bad(reason instanceof Error?`No se eliminó el evento: ${reason.message}`:"No se pudo eliminar el evento de Google Calendar.",502);
        }
      }
    }
    await sql`delete from workspace_events where id=${id}`;
  }
  else if(data.resource==="document") await sql`delete from workspace_documents where id=${id}`;
  else if(data.resource==="sprint") { await sql`update workspace_tasks set sprint_id=null,updated_at=now() where sprint_id=${id}`;await sql`delete from workspace_sprints where id=${id}`; }
  else return bad("Recurso inválido.");
  return NextResponse.json({ok:true});
}
