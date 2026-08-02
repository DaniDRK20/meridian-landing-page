"use client";
import {useState,type FormEvent} from "react";
import {Modal,useWorkspace,WorkspaceState,type WorkspaceEvent} from "../../workspace-store";

const monthLabel=(date:Date)=>date.toLocaleDateString("es-DO",{month:"long",year:"numeric"});
const isoDate=(year:number,month:number,day:number)=>`${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;

export default function CalendarPage(){
 const {events,save,remove}=useWorkspace();
 const today=new Date();
 const [viewDate,setViewDate]=useState(()=>new Date(today.getFullYear(),today.getMonth(),1));
 const [current,setCurrent]=useState<WorkspaceEvent|null|undefined>();
 const year=viewDate.getFullYear(),month=viewDate.getMonth();
 const days=new Date(year,month+1,0).getDate();
 const offset=(new Date(year,month,1).getDay()+6)%7;
 const isCurrentMonth=year===today.getFullYear()&&month===today.getMonth();
 const suggestedDate=isoDate(year,month,isCurrentMonth?today.getDate():1);
 const move=(amount:number)=>setViewDate(date=>new Date(date.getFullYear(),date.getMonth()+amount,1));
 const submit=async(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();const f=new FormData(e.currentTarget);await save("event",{id:current?.id,title:f.get("title"),event_date:f.get("event_date"),event_time:f.get("event_time"),kind:f.get("kind")});setCurrent(undefined)};
 return <WorkspaceState>
  <div className="workspace-heading calendar-heading"><div><span className="admin-eyebrow">Planificación del equipo</span><h1>Calendario Scrum</h1><p>Ceremonias, entregas y fechas importantes de cualquier mes.</p></div><button className="admin-primary" onClick={()=>setCurrent(null)}>+ Nuevo evento</button></div>
  <div className="calendar-toolbar"><div><button onClick={()=>move(-1)} aria-label="Mes anterior">←</button><button className="today-button" onClick={()=>setViewDate(new Date(today.getFullYear(),today.getMonth(),1))}>Hoy</button><button onClick={()=>move(1)} aria-label="Mes siguiente">→</button></div><h2>{monthLabel(viewDate)}</h2><span>{events.filter(event=>{const date=new Date(`${event.event_date.slice(0,10)}T12:00:00`);return date.getFullYear()===year&&date.getMonth()===month}).length} eventos</span></div>
  <div className="calendar"><header>{["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"].map(x=><b key={x}>{x}</b>)}</header><div className="calendar-grid">{Array.from({length:Math.ceil((offset+days)/7)*7},(_,i)=>{const day=i-offset+1;const date=isoDate(year,month,day);const valid=day>0&&day<=days;const dayEvents=valid?events.filter(x=>x.event_date.slice(0,10)===date):[];const isToday=valid&&date===isoDate(today.getFullYear(),today.getMonth(),today.getDate());return <article className={!valid?"outside":isToday?"is-today":""} key={i}><span>{valid?day:""}</span>{dayEvents.map(x=><button className="calendar-event" key={x.id} onClick={()=>setCurrent(x)} title={`${x.kind}${x.event_time?` · ${x.event_time.slice(0,5)}`:""}`}>{x.title}</button>)}</article>})}</div></div>
  {current!==undefined&&<Modal title={current?"Editar evento":"Nuevo evento"} onClose={()=>setCurrent(undefined)}><form className="workspace-form" onSubmit={submit}><label className="full">Título<input name="title" defaultValue={current?.title} required autoFocus/></label><label>Fecha<input name="event_date" type="date" defaultValue={current?.event_date?.slice(0,10)||suggestedDate} required/></label><label>Hora<input name="event_time" type="time" defaultValue={current?.event_time?.slice(0,5)||""}/></label><label>Tipo<select name="kind" defaultValue={current?.kind||"Evento"}>{["Evento","Daily Scrum","Sprint Planning","Sprint Review","Retrospectiva","Entrega","Fecha límite"].map(type=><option key={type}>{type}</option>)}</select></label><footer className="form-actions full">{current&&<button type="button" className="danger-button" onClick={async()=>{if(confirm("¿Eliminar evento?")){await remove("event",current.id);setCurrent(undefined)}}}>Eliminar</button>}<button type="button" className="secondary-button" onClick={()=>setCurrent(undefined)}>Cancelar</button><button className="admin-primary">Guardar evento</button></footer></form></Modal>}
 </WorkspaceState>
}
