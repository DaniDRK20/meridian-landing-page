"use client";
import * as Ably from "ably";
import {createContext,useContext,useEffect,useState,type ReactNode} from "react";

const RealtimeContext=createContext<Ably.Realtime|null>(null);

export function RealtimeProvider({enabled,children}:{enabled:boolean;children:ReactNode}){
 const [client,setClient]=useState<Ably.Realtime|null>(null);
 useEffect(()=>{if(!enabled)return;const realtime=new Ably.Realtime({authUrl:"/api/admin/chat/token",authMethod:"GET"});const timer=setTimeout(()=>setClient(realtime),0);return()=>{clearTimeout(timer);realtime.close()}},[enabled]);
 return <RealtimeContext.Provider value={client}>{children}</RealtimeContext.Provider>;
}
export function useRealtime(){return useContext(RealtimeContext)}
