"use client";

import { useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { navItems } from "./workspace-data";

export function WorkspaceShell({ user, children }: { user: { name: string; email: string }; children: ReactNode }) {
  const pathname = usePathname(); const router = useRouter(); const [open, setOpen] = useState(false);
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
      <header className="workspace-topbar"><button className="sidebar-toggle" onClick={() => setOpen(value => !value)} aria-label="Abrir navegación">☰</button><label className="global-search"><span aria-hidden="true">⌕</span><input placeholder="Buscar tareas, personas o documentos…" aria-label="Buscar" /></label><span className="sprint-pill">Workspace · Activo</span><span className="top-avatar" title={user.name}>{user.name.slice(0, 2).toUpperCase()}</span><button className="top-logout" onClick={logout} aria-label="Cerrar sesión" title="Cerrar sesión"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 5H6a2 2 0 00-2 2v10a2 2 0 002 2h4M14 8l4 4-4 4M9 12h9"/></svg><span>Salir</span></button></header>
      <main className="workspace-content">{children}</main>
    </div>
  </div>;
}
