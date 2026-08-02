"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { navItems } from "./workspace-data";
import { useWorkspace } from "./workspace-store";

export function WorkspaceShell({ user, children }: { user: { name: string; email: string }; children: ReactNode }) {
  const pathname = usePathname(); const router = useRouter(); const [open, setOpen] = useState(false); const [query, setQuery] = useState(""); const [searchOpen, setSearchOpen] = useState(false); const searchRef = useRef<HTMLInputElement>(null);
  const { tasks, members, sprints, events, documents } = useWorkspace();
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
  const logout = async () => { await fetch("/api/admin/logout", { method: "POST" }); router.replace("/admin/login"); router.refresh(); };
  return <div className="workspace-root">
    <aside className={`workspace-sidebar ${open ? "is-open" : ""}`}>
      <Link className="workspace-brand" href="/"><img src="/meridian-globe-transparent.png" alt="" /><span>Meridian <small>Workspace</small></span></Link>
      <nav aria-label="Navegación del Workspace">{navItems.map(([label, href, icon]) => <Link key={href} className={pathname === href ? "active" : ""} href={href} onClick={() => setOpen(false)}><i aria-hidden="true">{icon}</i>{label}</Link>)}</nav>
      <div className="workspace-profile"><span className="avatar">{user.name.slice(0, 2).toUpperCase()}</span><span><b>{user.name}</b><small>{user.email}</small></span></div>
      <button className="workspace-logout" onClick={logout}>Cerrar sesión</button>
    </aside>
    {open && <button className="sidebar-scrim" aria-label="Cerrar navegación" onClick={() => setOpen(false)} />}
    <div className="workspace-main">
      <header className="workspace-topbar"><button className="sidebar-toggle" onClick={() => setOpen(value => !value)} aria-label="Abrir navegación">☰</button><div className="global-search-wrap"><label className="global-search"><span aria-hidden="true">⌕</span><input ref={searchRef} value={query} onChange={event => { setQuery(event.target.value); setSearchOpen(true); }} onFocus={() => setSearchOpen(true)} onKeyDown={event => { if (event.key === "Escape") { setSearchOpen(false); searchRef.current?.blur(); } }} placeholder="Buscar tareas, personas o documentos…" aria-label="Buscar en Workspace" aria-expanded={searchOpen && query.trim().length >= 2} aria-controls="workspace-search-results" /><kbd>Ctrl K</kbd></label>{searchOpen && query.trim().length >= 2 && <div className="global-search-results" id="workspace-search-results" role="listbox">{results.length ? results.map((result, index) => <button key={`${result.type}-${result.title}-${index}`} role="option" onMouseDown={event => event.preventDefault()} onClick={() => { setQuery(""); setSearchOpen(false); router.push(result.href); }}><i>{result.type}</i><span><b>{result.title}</b><small>{result.meta}</small></span><strong>→</strong></button>) : <p>No encontramos resultados para “{query.trim()}”.</p>}</div>}</div><span className="sprint-pill">Workspace · Activo</span><span className="top-avatar" title={user.name}>{user.name.slice(0, 2).toUpperCase()}</span><button className="top-logout" onClick={logout} aria-label="Cerrar sesión" title="Cerrar sesión"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 5H6a2 2 0 00-2 2v10a2 2 0 002 2h4M14 8l4 4-4 4M9 12h9"/></svg><span>Salir</span></button></header>
      <main className="workspace-content">{children}</main>
    </div>
  </div>;
}
