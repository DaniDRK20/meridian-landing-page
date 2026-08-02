"use client";
import * as Ably from "ably";
import {createContext,useContext,useEffect,useState,type ReactNode} from "react";

export type PresenceState={id:string;name:string;email:string;state:"active"|"away"};
const RealtimeContext=createContext<Ably.Realtime|null>(null);
const PresenceContext=createContext<PresenceState[]>([]);

export function RealtimeProvider({enabled,user,children}:{enabled:boolean;user:{id:string;name:string;email:string};children:ReactNode}){
 const [client,setClient]=useState<Ably.Realtime|null>(null),[members,setMembers]=useState<PresenceState[]>([]);
 useEffect(()=>{
  if(!enabled)return;
  const realtime=new Ably.Realtime({authUrl:"/api/admin/chat/token",authMethod:"GET"}),channel=realtime.channels.get("meridian:workspace");
  const refresh=async()=>{const present=await channel.presence.get(),byUser=new Map<string,PresenceState>();for(const member of present){const info=member.data as Partial<PresenceState>|null;if(!member.clientId||!info?.name)continue;const current=byUser.get(member.clientId);if(!current||info.state==="active")byUser.set(member.clientId,{id:member.clientId,name:String(info.name),email:String(info.email||""),state:info.state==="away"?"away":"active"})}setMembers([...byUser.values()])};
  const enter=()=>channel.presence.enter({name:user.name,email:user.email,state:document.hidden?"away":"active"}).then(refresh).catch(()=>undefined);
  const visibility=()=>channel.presence.update({name:user.name,email:user.email,state:document.hidden?"away":"active"}).catch(()=>undefined);
  const listener=()=>void refresh();channel.presence.subscribe(listener);realtime.connection.on("connected",enter);document.addEventListener("visibilitychange",visibility);
  const timer=setTimeout(()=>setClient(realtime),0);
  return()=>{clearTimeout(timer);document.removeEventListener("visibilitychange",visibility);channel.presence.unsubscribe(listener);void channel.presence.leave();realtime.close()};
 },[enabled,user.id,user.name,user.email]);
 return <RealtimeContext.Provider value={client}><PresenceContext.Provider value={members}>{children}</PresenceContext.Provider></RealtimeContext.Provider>;
}
export function useRealtime(){return useContext(RealtimeContext)}
export function useWorkspacePresence(){return useContext(PresenceContext)}
export function PresenceSummary(){const members=useWorkspacePresence(),active=members.filter(member=>member.state==="active");return <div className="presence-summary" title={active.length?`${active.map(member=>member.name).join(", ")} en Workspace`:"Nadie más está conectado"}><span>{active.slice(0,4).map(member=><i key={member.id}>{member.name.slice(0,2).toUpperCase()}</i>)}</span><b><i/>{active.length} {active.length===1?"activo":"activos"}</b></div>}
