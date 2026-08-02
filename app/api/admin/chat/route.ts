import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/admin-db";
import { getAdminSession } from "@/lib/admin-session";
import { publishWorkspaceEvent } from "@/lib/ably";

const bad=(error:string,status=400)=>NextResponse.json({ok:false,error},{status});
const clean=(value:unknown,max:number)=>String(value??"").trim().slice(0,max);

export async function GET(request:NextRequest){
 const user=await getAdminSession();if(!user)return bad("No autorizado.",401);const sql=adminDb();const requested=clean(request.nextUrl.searchParams.get("channel"),50),summary=request.nextUrl.searchParams.get("summary")==="1";
 const [channels,users]=await Promise.all([
  sql`select c.*,count(m.id) filter(where m.created_at>coalesce(r.last_read_at,to_timestamp(0)) and m.author_id<>${user.id})::int unread_count from workspace_chat_channels c left join workspace_chat_reads r on r.channel_id=c.id and r.user_id=${user.id} left join workspace_chat_messages m on m.channel_id=c.id group by c.id,r.last_read_at order by c.created_at`,
  sql`select id,name,email from admin_users where is_active=true order by name`
 ]);if(summary)return NextResponse.json({ok:true,unread:channels.reduce((total,item)=>total+Number(item.unread_count||0),0)});const selected=requested||String(channels[0]?.id||"");
 const messages=selected?await sql`select m.id,m.channel_id,m.content,m.created_at,m.edited_at,m.author_id,u.name author_name,u.email author_email,r.id reply_id,r.content reply_content,ru.name reply_author,coalesce(array_agg(distinct mu.name) filter(where mu.id is not null),'{}') mentioned_names from workspace_chat_messages m join admin_users u on u.id=m.author_id left join workspace_chat_messages r on r.id=m.reply_to_id left join admin_users ru on ru.id=r.author_id left join workspace_chat_mentions mm on mm.message_id=m.id left join admin_users mu on mu.id=mm.user_id where m.channel_id=${selected} group by m.id,u.id,r.id,ru.id order by m.created_at desc limit 100`:[];
 if(selected)await sql`insert into workspace_chat_reads(channel_id,user_id,last_read_at) values(${selected},${user.id},now()) on conflict(channel_id,user_id) do update set last_read_at=now()`;
 return NextResponse.json({ok:true,currentUser:user,channels,users,messages:[...messages].reverse()});
}

export async function POST(request:NextRequest){
 const user=await getAdminSession();if(!user)return bad("No autorizado.",401);const data=await request.json();const sql=adminDb();
 if(data.action==="channel"){const name=clean(data.name,80);const slug=name.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");if(name.length<2||!slug)return bad("Escribe un nombre válido para el canal.");try{const rows=await sql`insert into workspace_chat_channels(name,slug,description,created_by) values(${name},${slug},${clean(data.description,220)},${user.id}) returning *`;return NextResponse.json({ok:true,item:rows[0]},{status:201})}catch{return bad("Ya existe un canal con ese nombre.")}}
 const channelId=clean(data.channelId,50),content=clean(data.content,4000),replyTo=clean(data.replyTo,50)||null;if(!channelId||!content)return bad("El mensaje no puede estar vacío.");
 const channel=await sql`select id from workspace_chat_channels where id=${channelId} limit 1`;if(!channel.length)return bad("El canal no existe.",404);
 const rows=await sql`insert into workspace_chat_messages(channel_id,author_id,reply_to_id,content) values(${channelId},${user.id},${replyTo},${content}) returning *`;
 const ids=Array.isArray(data.mentionIds)?data.mentionIds.map((id:unknown)=>clean(id,50)).filter(Boolean).slice(0,30):[];for(const id of ids)await sql`insert into workspace_chat_mentions(message_id,user_id) select ${rows[0].id},id from admin_users where id=${id} and is_active=true on conflict do nothing`;
 await sql`insert into workspace_chat_reads(channel_id,user_id,last_read_at) values(${channelId},${user.id},now()) on conflict(channel_id,user_id) do update set last_read_at=now()`;
 await publishWorkspaceEvent("chat.message",{messageId:rows[0].id,channelId,authorId:user.id,authorName:user.name,content,mentionIds:ids});
 return NextResponse.json({ok:true,item:rows[0]},{status:201});
}

export async function PATCH(request:NextRequest){const user=await getAdminSession();if(!user)return bad("No autorizado.",401);const data=await request.json(),id=clean(data.id,50),content=clean(data.content,4000);if(!id||!content)return bad("Mensaje inválido.");const sql=adminDb();const rows=await sql`update workspace_chat_messages set content=${content},edited_at=now() where id=${id} and author_id=${user.id} returning id,channel_id`;if(rows.length)await publishWorkspaceEvent("chat.updated",{messageId:id,channelId:rows[0].channel_id,authorId:user.id});return rows.length?NextResponse.json({ok:true}):bad("No puedes editar este mensaje.",403)}
export async function DELETE(request:NextRequest){const user=await getAdminSession();if(!user)return bad("No autorizado.",401);const id=clean((await request.json()).id,50),sql=adminDb();const existing=await sql`select channel_id from workspace_chat_messages where id=${id} limit 1`;const rows=await sql`delete from workspace_chat_messages where id=${id} and (author_id=${user.id} or ${user.role}='admin') returning id`;if(rows.length)await publishWorkspaceEvent("chat.deleted",{messageId:id,channelId:existing[0]?.channel_id,authorId:user.id});return rows.length?NextResponse.json({ok:true}):bad("No puedes eliminar este mensaje.",403)}
