import {randomBytes} from "node:crypto";
import {NextResponse} from "next/server";
import {getAdminSession} from "@/lib/admin-session";
import {googleConfigured,googleRedirectUri} from "@/lib/google-calendar";

export async function GET(){
 const user=await getAdminSession();if(!user)return NextResponse.redirect(new URL("/admin/login","https://meridian-ai-rd.vercel.app"));
 if(!googleConfigured())return NextResponse.json({ok:false,error:"La integración de Google Calendar todavía necesita sus credenciales."},{status:503});
 const state=randomBytes(24).toString("base64url"),url=new URL("https://accounts.google.com/o/oauth2/v2/auth");
 url.search=new URLSearchParams({client_id:process.env.GOOGLE_CLIENT_ID!,redirect_uri:googleRedirectUri(),response_type:"code",scope:"openid email https://www.googleapis.com/auth/calendar.events",access_type:"offline",prompt:"consent",include_granted_scopes:"true",state}).toString();
 const response=NextResponse.redirect(url);response.cookies.set("google_calendar_oauth_state",state,{httpOnly:true,secure:true,sameSite:"lax",path:"/api/admin/calendar/google",maxAge:600});return response;
}
