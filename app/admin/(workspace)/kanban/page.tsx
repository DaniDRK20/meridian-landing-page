"use client";
import { useState } from "react";
import { tasks } from "../../workspace-data";
const columns = ["Ideas", "Backlog", "Sprint actual", "En desarrollo", "Code Review", "Testing", "Completado"];

export default function KanbanPage() {
  const [selected, setSelected] = useState<(typeof tasks)[number] | null>(null);
  return <><div className="workspace-heading"><div><span className="admin-eyebrow">Workspace</span><h1>Kanban del producto</h1><p>Flujo completo desde la idea hasta producción.</p></div><button className="admin-primary demo-action">+ Nueva tarea</button></div>
    <div className="kanban-board">{columns.map(column => <section className="kanban-column" key={column}><header><h2>{column}</h2><span>{tasks.filter(task => task.state === column).length}</span></header>{tasks.filter(task => task.state === column).map(task => <button className="kanban-card" key={task.id} onClick={() => setSelected(task)}><small>{task.id} · {task.tag}</small><b>{task.title}</b><div className="card-meta"><span className={`priority ${task.priority.toLowerCase()}`}>{task.priority}</span><span className="avatar">{task.owner.slice(0,2)}</span></div><div className="progress"><i style={{ width: `${task.progress}%` }} /></div><footer><span>{task.due}</span><span>{task.progress}%</span></footer></button>)}</section>)}</div>
    {selected && <div className="task-drawer" role="dialog" aria-modal="true" aria-label={`Detalle de ${selected.title}`}><button className="drawer-close" onClick={() => setSelected(null)}>×</button><small>{selected.id}</small><h2>{selected.title}</h2><p>Historia de usuario preparada para conectar con el backend de Workspace.</p><dl><div><dt>Estado</dt><dd>{selected.state}</dd></div><div><dt>Prioridad</dt><dd>{selected.priority}</dd></div><div><dt>Responsable</dt><dd>{selected.owner}</dd></div><div><dt>Fecha límite</dt><dd>{selected.due}</dd></div></dl><h3>Checklist</h3>{["Criterios definidos", "Diseño validado", "Implementación", "Pruebas"].map((item,index)=><label className="check-item" key={item}><input type="checkbox" defaultChecked={index<2}/>{item}</label>)}<div className="drawer-links"><button>Figma ↗</button><button>GitHub ↗</button></div><p className="demo-note">Datos demostrativos. La persistencia de tareas se conectará en una fase posterior.</p></div>}
  </>;
}
