"use client";
import { createContext,useCallback,useContext,useEffect,useState,type ReactNode } from "react";

export type Member={id:string;name:string;role:string;email:string|null;availability:string;workload:number;task_count:number;completed_count:number};
export type Sprint={id:string;name:string;goal:string;starts_on:string;ends_on:string;status:string;task_count:number;completed_count:number;points:number};
export type Task={id:string;code:string;title:string;description:string;status:string;priority:string;tag:string;story_points:number;progress:number;due_on:string|null;assignee_id:string|null;assignee_name:string|null;sprint_id:string|null;sprint_name:string|null};
export type WorkspaceEvent={id:string;title:string;event_date:string;event_time:string|null;kind:string};
export type WorkspaceDocument={id:string;title:string;category:string;content:string;updated_at:string};
type Data={tasks:Task[];members:Member[];sprints:Sprint[];events:WorkspaceEvent[];documents:WorkspaceDocument[]};
type Store=Data&{loading:boolean;error:string;reload:()=>Promise<void>;save:(resource:string,value:Record<string,unknown>)=>Promise<void>;remove:(resource:string,id:string)=>Promise<void>};
const empty:Data={tasks:[],members:[],sprints:[],events:[],documents:[]};
const Context=createContext<Store|null>(null);

export function WorkspaceProvider({children}:{children:ReactNode}){
 const [data,setData]=useState(empty); const [loading,setLoading]=useState(true); const [error,setError]=useState("");
 const reload=useCallback(async()=>{setLoading(true);try{const response=await fetch("/api/admin/workspace",{cache:"no-store"});const result=await response.json();if(!response.ok)throw new Error(result.error);setData(result);setError("")}catch(reason){setError(reason instanceof Error?reason.message:"No se pudo cargar Workspace.")}finally{setLoading(false)}},[]);
 useEffect(()=>{let active=true;fetch("/api/admin/workspace",{cache:"no-store"}).then(async response=>{const result=await response.json();if(!response.ok)throw new Error(result.error);if(active){setData(result);setError("")}}).catch(reason=>{if(active)setError(reason instanceof Error?reason.message:"No se pudo cargar Workspace.")}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[]);
 const save=async(resource:string,value:Record<string,unknown>)=>{const response=await fetch("/api/admin/workspace",{method:value.id?"PATCH":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({resource,...value})});const result=await response.json();if(!response.ok)throw new Error(result.error||"No se pudo guardar.");await reload()};
 const remove=async(resource:string,id:string)=>{const response=await fetch("/api/admin/workspace",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({resource,id})});const result=await response.json();if(!response.ok)throw new Error(result.error||"No se pudo eliminar.");await reload()};
 return <Context.Provider value={{...data,loading,error,reload,save,remove}}>{children}</Context.Provider>;
}
export function useWorkspace(){const value=useContext(Context);if(!value)throw new Error("WorkspaceProvider faltante");return value}

export function WorkspaceState({children}:{children:ReactNode}){const {loading,error}=useWorkspace();if(loading)return <div className="workspace-state">Cargando información…</div>;if(error)return <div className="workspace-state error">{error}</div>;return children}

export function Modal({title,onClose,children}:{title:string;onClose:()=>void;children:ReactNode}){return <div className="modal-backdrop" role="presentation" onMouseDown={event=>{if(event.target===event.currentTarget)onClose()}}><section className="workspace-modal" role="dialog" aria-modal="true" aria-label={title}><header><h2>{title}</h2><button type="button" onClick={onClose} aria-label="Cerrar">×</button></header>{children}</section></div>}
