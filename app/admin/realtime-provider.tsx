"use client";
import * as Ably from "ably";
import {createContext,useContext,useEffect,useState,type ReactNode} from "react";

export type PresenceState={id:string;name:string;email:string;state:"active"|"away";typing_channel?:string|null};
const RealtimeContext=createContext<Ably.Realtime|null>(null);
const PresenceContext=createContext<PresenceState[]>([]);

export function RealtimeProvider({enabled,user,children}:{enabled:boolean;user:{id:string;name:string;email:string};children:ReactNode}){
 const [client,setClient]=useState<Ably.Realtime|null>(null),[members,setMembers]=useState<PresenceState[]>([]);
 useEffect(()=>{
  let stopped=false;
  const loadPresence=async()=>{try{const response=await fetch("/api/admin/presence",{cache:"no-store"}),result=await response.json();if(!stopped&&result.ok)setMembers(result.members.filter((member:{state:string})=>member.state!=="offline"))}catch{}};
  const heartbeat=async()=>{try{await fetch("/api/admin/presence",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({state:document.hidden?"away":"active"})});await loadPresence()}catch{}};
  void heartbeat();
  const heartbeatTimer=window.setInterval(heartbeat,15000),presenceTimer=window.setInterval(loadPresence,1200);
  const visibility=()=>void heartbeat();document.addEventListener("visibilitychange",visibility);
  if(!enabled)return()=>{stopped=true;clearInterval(heartbeatTimer);clearInterval(presenceTimer);document.removeEventListener("visibilitychange",visibility)};
  const realtime=new Ably.Realtime({authUrl:"/api/admin/chat/token",authMethod:"GET"});
  realtime.connection.on("connected",()=>setClient(realtime));
  realtime.connection.on("disconnected",()=>setClient(null));realtime.connection.on("failed",()=>setClient(null));
  if(realtime.connection.state==="connected")window.setTimeout(()=>setClient(realtime),0);
  return()=>{stopped=true;clearInterval(heartbeatTimer);clearInterval(presenceTimer);document.removeEventListener("visibilitychange",visibility);realtime.close()};
 },[enabled,user.id,user.name,user.email]);
 return <RealtimeContext.Provider value={client}><PresenceContext.Provider value={members}>{children}</PresenceContext.Provider></RealtimeContext.Provider>;
}
export function useRealtime(){return useContext(RealtimeContext)}
export function useWorkspacePresence(){return useContext(PresenceContext)}
export function PresenceSummary(){const members=useWorkspacePresence(),active=members.filter(member=>member.state==="active");return <div className="presence-summary" title={active.length?`${active.map(member=>member.name).join(", ")} en Workspace`:"Nadie más está conectado"}><span>{active.slice(0,4).map(member=><i key={member.id}>{member.name.slice(0,2).toUpperCase()}</i>)}</span><b><i/>{active.length} {active.length===1?"activo":"activos"}</b></div>}
