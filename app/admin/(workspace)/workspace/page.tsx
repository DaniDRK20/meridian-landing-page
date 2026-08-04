"use client";

import { CalendarDays, Columns3, FileText, ListChecks } from "lucide-react";
import { useWorkspace, WorkspaceState } from "../../workspace-store";

const moduleIcons = {
  Kanban: Columns3,
  Backlog: ListChecks,
  Calendario: CalendarDays,
  Documentación: FileText,
};

export default function WorkspacePage() {
  const { tasks, documents, events } = useWorkspace();
  const modules = [
    ["Kanban", `${tasks.length} tareas activas`, "/admin/kanban"],
    ["Backlog", `${tasks.filter((task) => task.status === "Backlog").length} historias`, "/admin/backlog"],
    ["Calendario", `${events.length} eventos`, "/admin/calendario"],
    ["Documentación", `${documents.length} documentos`, "/admin/documentacion"],
  ] as const;

  return (
    <WorkspaceState>
      <div className="workspace-heading">
        <div>
          <span className="admin-eyebrow">Meridian Workspace</span>
          <h1>Centro operativo</h1>
          <p>Todos los módulos comparten información persistente.</p>
        </div>
      </div>

      <div className="docs-grid workspace-module-grid">
        {modules.map(([title, text, href]) => {
          const Icon = moduleIcons[title];
          const moduleClass = title.toLowerCase().replace("ó", "o");

          return (
            <a className="doc-card workspace-module-card" href={href} key={title}>
              <span className={`workspace-module-icon ${moduleClass}`} aria-hidden="true">
                <Icon />
              </span>
              <h2>{title}</h2>
              <p>{text}</p>
              <small>Abrir <span aria-hidden="true">→</span></small>
            </a>
          );
        })}
      </div>

      <section className="workspace-panel" style={{ marginTop: 18 }}>
        <header><h2>Trabajo reciente</h2></header>
        <div className="delivery-list">
          {tasks.slice(0, 5).map((task) => (
            <p key={task.id}>
              <span className="priority-dot" />
              <b>{task.title}</b>
              <small>{task.status}</small>
            </p>
          ))}
        </div>
      </section>
    </WorkspaceState>
  );
}
