"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {CalendarDays,CircleUserRound,Clock3,Contrast,FileText,Kanban,LayoutDashboard,ListChecks,MessageCircle,PanelsTopLeft,Settings,UsersRound,Rows3,type LucideIcon} from "lucide-react";
import { navItems } from "./workspace-data";
import { useWorkspace } from "./workspace-store";
import { PresenceSummary, useRealtime } from "./realtime-provider";
import { defaultPreferences, playNotificationSound } from "./notification-sound";

const navIcons:Record<string,LucideIcon>={chat:MessageCircle,dashboard:LayoutDashboard,workspace:PanelsTopLeft,kanban:Kanban,backlog:ListChecks,sprintBacklog:Rows3,sprint:Clock3,team:UsersRound,calendar:CalendarDays,docs:FileText,settings:Settings,profile:CircleUserRound};

export function WorkspaceShell({ user, children }: { user: { id: string; name: string; email: string }; children: ReactNode }) {
  const pathname = usePathname(); const router = useRouter(); const [open, setOpen] = useState(false); const [query, setQuery] = useState(""); const [searchOpen, setSearchOpen] = useState(false); const [toast,setToast]=useState<{title:string;body:string;mentioned:boolean}|null>(null); const [unread,setUnread]=useState(0); const [preferences,setPreferences]=useState(defaultPreferences); const searchRef = useRef<HTMLInputElement>(null); const unreadRef=useRef<number|null>(null); const latestRef=useRef<string|null>(null); const realtime=useRealtime();
  const { tasks, members, sprints, events, documents } = useWorkspace();
  const playMessageSound=()=>{if(preferences.sounds)playNotificationSound(preferences.soundData)};
  const results = (() => {
    const value = query.trim().toLowerCase(); if (value.length < 2) return [];
    const includes = (...parts: (string | null | undefined)[]) => parts.join(" ").toLowerCase().includes(value);
    return [
      ...tasks.filter(item => includes(item.code, item.title, item.description, item.tag, item.assignee_name)).map(item => ({ type: "Historia", title: `${item.code} · ${item.title}`, meta: `${item.status} · ${item.assignee_name || "Sin asignar"}`, href: "/admin/backlog" })),
      ...members.filter(item => includes(item.name, item.role, item.email)).map(item => ({ type: "Persona", title: item.name, meta: item.role, href: "/admin/equipo" })),
      ...sprints.filter(item => includes(item.name, item.goal, item.status)).map(item => ({ type: "Sprint", title: item.name, meta: item.goal || "Sin objetivo", href: "/admin/sprint" })),
      ...events.filter(item => includes(item.title, item.kind, item.event_date)).map(item => ({ type: "Evento", title: item.title, meta: `${item.kind} · ${new Date(`${item.event_date.slice(0, 10)}T12:00:00`).toLocaleDateString("es")}`, href: "/admin/calendario" })),
      ...documents.filter(item => includes(item.title, item.category, item.content)).map(item => ({ type: "Documento", title: item.title, meta: item.category, href: "/admin/documentacion" })),
    ].slice(0, 10);
  })();
  useEffect(() => { const shortcut = (event: KeyboardEvent) => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); searchRef.current?.focus(); setSearchOpen(true); } }; window.addEventListener("keydown", shortcut); return () => window.removeEventListener("keydown", shortcut); }, []);
  useEffect(()=>{const read=()=>{try{setPreferences(value=>({...value,...JSON.parse(localStorage.getItem("meridian-preferences")||"{}")}))}catch{}};const update=(event:Event)=>setPreferences((event as CustomEvent).detail);read();window.addEventListener("meridian-preferences",update);return()=>window.removeEventListener("meridian-preferences",update)},[]);
  const toggleMonochrome=()=>{const next={...preferences,monochrome:!preferences.monochrome};setPreferences(next);localStorage.setItem("meridian-preferences",JSON.stringify(next));window.dispatchEvent(new CustomEvent("meridian-preferences",{detail:next}))};
  useEffect(()=>{let stopped=false;const refresh=()=>fetch("/api/admin/chat?summary=1",{cache:"no-store"}).then(response=>response.json()).then(result=>{if(stopped||!result.ok)return;const next=Number(result.unread)||0;setUnread(next);unreadRef.current=next;if(!result.latest)return;if(latestRef.current===null){latestRef.current=result.latest.id;return}if(result.latest.id!==latestRef.current){latestRef.current=result.latest.id;const mentioned=Boolean(result.latest.mentioned),title=mentioned?`${result.latest.author_name} te mencionó`:`Nuevo mensaje de ${result.latest.author_name}`;setToast({title,body:result.latest.content,mentioned});playMessageSound();window.setTimeout(()=>setToast(null),6000);if(document.hidden&&Notification.permission==="granted")new Notification(title,{body:result.latest.content,icon:"/favicon.svg",tag:`meridian-chat-${result.latest.id}`})}}).catch(()=>undefined);void refresh();const timer=window.setInterval(refresh,3000);return()=>{stopped=true;window.clearInterval(timer)}},[pathname]);
  useEffect(()=>{if(!realtime)return;const channel=realtime.channels.get("meridian:workspace"),listener=(message:{name?:string;data?:{messageId?:string;authorId?:string;authorName?:string;content?:string;mentionIds?:string[]}})=>{if(message.name!=="chat.message"||message.data?.authorId===user.id)return;latestRef.current=message.data?.messageId||null;setUnread(value=>{const next=value+1;unreadRef.current=next;return next});const mentioned=message.data?.mentionIds?.includes(user.id)||false,title=mentioned?`${message.data?.authorName} te mencionó`:`Nuevo mensaje de ${message.data?.authorName}`,body=message.data?.content||"Nuevo mensaje en Meridian";setToast({title,body,mentioned});playMessageSound();window.setTimeout(()=>setToast(null),6000);if(document.hidden&&Notification.permission==="granted")new Notification(title,{body,icon:"/favicon.svg",tag:"meridian-chat"})};channel.subscribe("chat.message",listener);return()=>{channel.unsubscribe("chat.message",listener)}},[realtime,user.id]);
  const logout = async () => { await fetch("/api/admin/logout", { method: "POST" }); router.replace("/admin/login"); router.refresh(); };
  return <div className={`workspace-root ${preferences.monochrome?"workspace-monochrome":""} ${preferences.reducedMotion?"workspace-reduced-motion":""} ${preferences.compact?"workspace-compact":""}`}>
    <aside className={`workspace-sidebar ${open ? "is-open" : ""}`}>
      <Link className="workspace-brand" href="/"><Image src="/meridian-globe-transparent.png" width={42} height={42} alt="" /><span>Meridian <small>Workspace</small></span></Link>
      <nav aria-label="Navegación del Workspace">{navItems.map(([label, href, icon]) => {const Icon=navIcons[icon];return <Link key={href} className={pathname === href ? "active" : ""} href={href} onClick={() => {setOpen(false);if(href==="/admin/chat"){setUnread(0);unreadRef.current=0}}}><Icon aria-hidden="true" size={19} strokeWidth={1.8}/>{label}{href==="/admin/chat"&&unread>0&&<em className="nav-unread">{unread>99?"99+":unread}</em>}</Link>})}</nav>
      <div className="workspace-profile"><span className="avatar">{user.name.slice(0, 2).toUpperCase()}</span><span><b>{user.name}</b><small>{user.email}</small></span></div>
      <button className="workspace-logout" onClick={logout}>Cerrar sesión</button>
    </aside>
    {open && <button className="sidebar-scrim" aria-label="Cerrar navegación" onClick={() => setOpen(false)} />}
    <div className="workspace-main">
      <header className="workspace-topbar"><button className="sidebar-toggle" onClick={() => setOpen(value => !value)} aria-label="Abrir navegación">☰</button><div className="global-search-wrap"><label className="global-search"><span aria-hidden="true">⌕</span><input ref={searchRef} value={query} onChange={event => { setQuery(event.target.value); setSearchOpen(true); }} onFocus={() => setSearchOpen(true)} onKeyDown={event => { if (event.key === "Escape") { setSearchOpen(false); searchRef.current?.blur(); } }} placeholder="Buscar tareas, personas o documentos…" aria-label="Buscar en Workspace" aria-expanded={searchOpen && query.trim().length >= 2} aria-controls="workspace-search-results" /><kbd>Ctrl K</kbd></label>{searchOpen && query.trim().length >= 2 && <div className="global-search-results" id="workspace-search-results" role="listbox">{results.length ? results.map((result, index) => <button key={`${result.type}-${result.title}-${index}`} role="option" onMouseDown={event => event.preventDefault()} onClick={() => { setQuery(""); setSearchOpen(false); router.push(result.href); }}><i>{result.type}</i><span><b>{result.title}</b><small>{result.meta}</small></span><strong>→</strong></button>) : <p>No encontramos resultados para “{query.trim()}”.</p>}</div>}</div><span className="sprint-pill">Workspace · Activo</span><button className="theme-toggle" onClick={toggleMonochrome} aria-label="Alternar modo blanco y negro" title="Modo blanco y negro"><Contrast size={18}/></button><span className="top-avatar" title={user.name}>{user.name.slice(0, 2).toUpperCase()}</span><button className="top-logout" onClick={logout} aria-label="Cerrar sesión" title="Cerrar sesión"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 5H6a2 2 0 00-2 2v10a2 2 0 002 2h4M14 8l4 4-4 4M9 12h9"/></svg><span>Salir</span></button></header>
      <main className="workspace-content"><PresenceSummary/>{children}</main>
      {toast&&<button className={`workspace-toast ${toast.mentioned?"mentioned":""}`} onClick={()=>{setToast(null);if("Notification" in window&&Notification.permission==="default")void Notification.requestPermission();router.push("/admin/chat")}}><i>✦</i><span><b>{toast.title}</b><small>{toast.body}</small></span><strong>→</strong></button>}
    </div>
  </div>;
}
