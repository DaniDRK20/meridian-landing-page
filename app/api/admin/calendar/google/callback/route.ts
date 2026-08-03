import {cookies} from "next/headers";
import {NextRequest,NextResponse} from "next/server";
import {adminDb} from "@/lib/admin-db";
import {getAdminSession} from "@/lib/admin-session";
import {encryptToken,ensureGoogleCalendarSchema,googleConfigured,googleRedirectUri} from "@/lib/google-calendar";

export async function GET(request:NextRequest){
 const user=await getAdminSession(),target=new URL("/admin/calendario",request.url);if(!user)return NextResponse.redirect(new URL("/admin/login",request.url));
 const jar=await cookies(),state=request.nextUrl.searchParams.get("state"),expected=jar.get("google_calendar_oauth_state")?.value,code=request.nextUrl.searchParams.get("code");
 if(!googleConfigured()||!code||!state||state!==expected){target.searchParams.set("google","error");return NextResponse.redirect(target)}
 const tokenResponse=await fetch("https://oauth2.googleapis.com/token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({code,client_id:process.env.GOOGLE_CLIENT_ID!,client_secret:process.env.GOOGLE_CLIENT_SECRET!,redirect_uri:googleRedirectUri(),grant_type:"authorization_code"})}),tokens=await tokenResponse.json();
 if(!tokenResponse.ok||!tokens.access_token){target.searchParams.set("google","error");return NextResponse.redirect(target)}
 const profileResponse=await fetch("https://openidconnect.googleapis.com/v1/userinfo",{headers:{Authorization:`Bearer ${tokens.access_token}`}}),profile=profileResponse.ok?await profileResponse.json():{};
 await ensureGoogleCalendarSchema();const sql=adminDb(),existing=await sql`select refresh_token from workspace_google_calendar_connections where user_id=${user.id} limit 1`,refresh=tokens.refresh_token?encryptToken(tokens.refresh_token):existing[0]?.refresh_token;
 if(!refresh){target.searchParams.set("google","refresh");return NextResponse.redirect(target)}
 await sql`insert into workspace_google_calendar_connections(user_id,google_email,access_token,refresh_token,expires_at) values(${user.id},${profile.email||null},${encryptToken(tokens.access_token)},${refresh},${new Date(Date.now()+Number(tokens.expires_in||3600)*1000).toISOString()}) on conflict(user_id) do update set google_email=excluded.google_email,access_token=excluded.access_token,refresh_token=excluded.refresh_token,expires_at=excluded.expires_at,updated_at=now()`;
 target.searchParams.set("google","connected");const response=NextResponse.redirect(target);response.cookies.delete("google_calendar_oauth_state");return response;
}
