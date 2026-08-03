"use client";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useRealtime, useWorkspacePresence } from "../../realtime-provider";
import {ChevronRight,Hash,Plus,Trash2,UserPlus,UserRound} from "lucide-react";
type Channel = {
  id: string;
  name: string;
  slug: string;
  description: string;
  unread_count: number;
  kind: "channel" | "direct";
  display_name: string;
};
type User = { id: string; name: string; email: string };
type Message = {
  id: string;
  content: string;
  created_at: string;
  edited_at: string | null;
  author_id: string;
  author_name: string;
  reply_id: string | null;
  reply_content: string | null;
  reply_author: string | null;
};
type Payload = {
  currentUser: User;
  channels: Channel[];
  users: User[];
  messages: Message[];
};

export default function ChatPage() {
  const [data, setData] = useState<Payload | null>(null),
    [channel, setChannel] = useState(""),
    [text, setText] = useState(""),
    [reply, setReply] = useState<Message | null>(null),
    [editing, setEditing] = useState<Message | null>(null),
    [newChannel, setNewChannel] = useState(false),
    [directPicker, setDirectPicker] = useState(false),
    [editingChannel, setEditingChannel] = useState<Channel | null>(null),
    [typingUsers, setTypingUsers] = useState<string[]>([]),
    [error, setError] = useState("");
  const bottom = useRef<HTMLDivElement>(null),
    textarea = useRef<HTMLTextAreaElement>(null),
    typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null),
    lastTypingSent = useRef(0),
    remoteTypingTimers = useRef(new Map<string,ReturnType<typeof setTimeout>>()),
    realtime = useRealtime();
  const presence=useWorkspacePresence(),visibleTypingUsers=[...new Set([...typingUsers,...presence.filter(member=>member.id!==data?.currentUser?.id&&member.typing_channel===channel).map(member=>member.name)])];
  const load = useCallback(
    async (id?: string, quiet = false) => {
      try {
        const response = await fetch(
            `/api/admin/chat${id ? `?channel=${id}` : ""}`,
            { cache: "no-store" },
          ),
          result = await response.json();
        if (!response.ok) throw new Error(result.error);
        setData(result);
        if (!id && !channel && result.channels[0])
          setChannel(result.channels[0].id);
        setError("");
      } catch (reason) {
        if (!quiet)
          setError(
            reason instanceof Error
              ? reason.message
              : "No se pudo cargar el chat.",
          );
      }
    },
    [channel],
  );
  useEffect(() => {
    const initial = setTimeout(() => void load(channel || undefined), 0),
      timer = setInterval(
        () => void load(channel || undefined, true),
        2000,
      );
    return () => {
      clearTimeout(initial);
      clearInterval(timer);
    };
  }, [channel, load, realtime]);
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [data?.messages.length, channel]);
  useEffect(() => {
    if (!realtime) return;
    const live = realtime.channels.get("meridian:workspace"),
      listener = () => void load(channel, true);
    live.subscribe(listener);
    return () => {
      live.unsubscribe(listener);
    };
  }, [realtime, channel, load]);
  useEffect(()=>{if(!realtime||!data?.currentUser)return;const live=realtime.channels.get("meridian:workspace"),listener=(message:{data?:{channelId?:string;userId?:string;userName?:string;typing?:boolean}})=>{const info=message.data;if(!info?.userId||info.userId===data.currentUser.id||info.channelId!==channel)return;const previous=remoteTypingTimers.current.get(info.userId);if(previous)clearTimeout(previous);setTypingUsers(users=>info.typing?[...new Set([...users,info.userName||"Alguien"])]:users.filter(name=>name!==info.userName));if(info.typing){const timer=setTimeout(()=>setTypingUsers(users=>users.filter(name=>name!==info.userName)),2200);remoteTypingTimers.current.set(info.userId,timer)}};live.subscribe("chat.typing",listener);const timers=remoteTypingTimers.current;return()=>{live.unsubscribe("chat.typing",listener);timers.forEach(clearTimeout);timers.clear();setTypingUsers([])}},[realtime,channel,data?.currentUser]);
  const publishTyping=(typing:boolean)=>{if(!realtime||!data?.currentUser||!channel)return;void realtime.channels.get("meridian:workspace").publish("chat.typing",{channelId:channel,userId:data.currentUser.id,userName:data.currentUser.name,typing}).catch(()=>undefined)};
  const publishTypingFallback=(typing:boolean)=>{const now=Date.now();if(typing&&now-lastTypingSent.current<800)return;lastTypingSent.current=now;void fetch("/api/admin/presence",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({typingChannel:typing?channel:null})}).catch(()=>undefined)};
  const updateText=(value:string)=>{setText(value);const typing=Boolean(value.trim());publishTyping(typing);publishTypingFallback(typing);if(typingTimer.current)clearTimeout(typingTimer.current);typingTimer.current=setTimeout(()=>{publishTyping(false);publishTypingFallback(false)},1400)};
  const mentionIds =
      data?.users
        .filter((user) =>
          new RegExp(
            `@${user.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=\\s|$|[.,!?])`,
            "i",
          ).test(text),
        )
        .map((user) => user.id) || [],
    mentionQuery = text.match(/(^|\s)@([^\s@]*)$/)?.[2]?.toLowerCase();
  const send = async (event: FormEvent) => {
    event.preventDefault();
    if (!text.trim()) return;
    const response = await fetch("/api/admin/chat", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          editing
            ? { id: editing.id, content: text }
            : {
                channelId: channel,
                content: text,
                replyTo: reply?.id,
                mentionIds,
              },
        ),
      }),
      result = await response.json();
    if (!response.ok) {
      setError(result.error);
      return;
    }
    setText("");
    publishTyping(false);
    publishTypingFallback(false);
    setReply(null);
    setEditing(null);
    await load(channel);
    textarea.current?.focus();
  };
  const chooseMention = (user: User) => {
      const match = text.match(/(^|\s)@([^\s@]*)$/);
      setText(
        match
          ? text.slice(0, match.index! + match[1].length) + `@${user.name} `
          : text + ` @${user.name} `,
      );
      textarea.current?.focus();
    },
    remove = async (id: string) => {
      if (!confirm("¿Eliminar este mensaje?")) return;
      await fetch("/api/admin/chat", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      await load(channel);
    },
    deleteChannel = async (item: Channel) => {
      if (!confirm(`¿Eliminar #${item.name} y todos sus mensajes?`)) return;
      const response = await fetch("/api/admin/chat", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "channel", id: item.id }),
        }),
        result = await response.json();
      if (!response.ok) {
        setError(result.error);
        return;
      }
      setEditingChannel(null);
      setNewChannel(false);
      setChannel(result.nextChannelId || "");
      await load(result.nextChannelId || undefined);
    };
  return (
    <div className="chat-page">
      <div className="workspace-heading chat-heading">
        <div>
          <span className="admin-eyebrow">Comunicación</span>
          <h1>Chat del equipo</h1>
          <p>Conversaciones, respuestas y menciones en un solo lugar.</p>
        </div>
        <div className="chat-create-actions"><button className="secondary-button" onClick={() => setDirectPicker(true)}><UserPlus size={17}/> Mensaje directo</button><button className="secondary-button" onClick={() => setNewChannel(true)}><Plus size={17}/> Canal</button></div>
      </div>
      <div className="chat-mobile-actions" aria-label="Acciones del chat">
        <button className="secondary-button" onClick={() => setDirectPicker(true)}><UserPlus size={17}/> Mensaje directo</button>
        <button className="secondary-button" onClick={() => setNewChannel(true)}><Plus size={17}/> Canal</button>
      </div>
      <section className="chat-shell">
        <aside className="chat-channels">
          <header>
            <b>Canales</b>
            <small>{data?.users.length || 0} personas</small>
          </header>
          {data?.channels.map((item) => (
            <button
              key={item.id}
              className={channel === item.id ? "active" : ""}
              onClick={() => setChannel(item.id)}
            >
              <span>{item.kind==="direct"?<UserRound size={18}/>:<Hash size={18}/>}</span>
              <i>
                <b>{item.display_name||item.name}</b>
                <small>{item.description}</small>
              </i>
              {item.unread_count > 0 && <em>{item.unread_count}</em>}
            </button>
          ))}
        </aside>
        <div className="chat-room">
          <header>
            <div>
              <b>
                {data?.channels.find((item) => item.id === channel)?.kind==="direct"?"":"# "}
                {data?.channels.find((item) => item.id === channel)?.display_name ||
                  "Chat"}
              </b>
              <small>
                {
                  data?.channels.find((item) => item.id === channel)
                    ?.description
                }
              </small>
            </div>
            <div className="chat-header-actions">
              <span>
                <i /> Actualización automática
              </span>
              {data?.channels.find((item) => item.id === channel)?.kind!=="direct"&&<>
                <button type="button" onClick={() => setEditingChannel(data?.channels.find((item) => item.id === channel) || null)}>Editar canal</button>
                {data?.channels.find((item) => item.id === channel)?.slug!=="general"&&<button
                  type="button"
                  className="chat-delete-channel"
                  aria-label="Eliminar canal"
                  title="Eliminar canal"
                  onClick={() => {const item=data?.channels.find((entry)=>entry.id===channel);if(item)void deleteChannel(item)}}
                ><Trash2 size={16}/><span>Eliminar</span></button>}
              </>}
            </div>
          </header>
          <div className="chat-feed">
            {error && <p className="admin-error">{error}</p>}
            {data?.messages.length === 0 && (
              <div className="chat-empty">
                <strong>Empieza la conversación</strong>
                <span>
                  Comparte una actualización o menciona a alguien con @.
                </span>
              </div>
            )}
            {data?.messages.map((message, index) => {
              const previous = data.messages[index - 1],
                grouped =
                  previous?.author_id === message.author_id &&
                  new Date(message.created_at).getTime() -
                    new Date(previous.created_at).getTime() <
                    300000;
              return (
                <article
                  className={`chat-message ${grouped ? "grouped" : ""}`}
                  key={message.id}
                >
                  {!grouped && (
                    <span className="avatar">
                      {message.author_name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                  <div>
                    {!grouped && (
                      <header>
                        <b>{message.author_name}</b>
                        <time>
                          {new Date(message.created_at).toLocaleString("es", {
                            day: "numeric",
                            month: "short",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </time>
                      </header>
                    )}
                    {message.reply_id && (
                      <blockquote>
                        <b>{message.reply_author}</b> {message.reply_content}
                      </blockquote>
                    )}
                    <p>
                      {message.content
                        .split(/(@[^\s.,!?]+)/g)
                        .map((part, i) =>
                          part.startsWith("@") ? (
                            <mark key={i}>{part}</mark>
                          ) : (
                            part
                          ),
                        )}{" "}
                      {message.edited_at && <small>(editado)</small>}
                    </p>
                    <footer>
                      <button
                        onClick={() => {
                          setReply(message);
                          setEditing(null);
                          textarea.current?.focus();
                        }}
                      >
                        Responder
                      </button>
                      {message.author_id === data.currentUser.id && (
                        <>
                          <button
                            onClick={() => {
                              setEditing(message);
                              setReply(null);
                              setText(message.content);
                              textarea.current?.focus();
                            }}
                          >
                            Editar
                          </button>
                          <button onClick={() => remove(message.id)}>
                            Eliminar
                          </button>
                        </>
                      )}
                    </footer>
                  </div>
                </article>
              );
            })}
            {visibleTypingUsers.length>0&&<div className="chat-typing-row"><span className="avatar">{visibleTypingUsers[0].slice(0,2).toUpperCase()}</span><div><small>{visibleTypingUsers.join(", ")} {visibleTypingUsers.length===1?"está":"están"} escribiendo…</small><span className="chat-typing-bubble"><i/><i/><i/></span></div></div>}
            <div ref={bottom} />
          </div>
          <form className="chat-composer" onSubmit={send}>
            {(reply || editing) && (
              <div className="chat-context">
                <span>
                  {editing
                    ? "Editando mensaje"
                    : `Respondiendo a ${reply?.author_name}`}
                  <small>{editing ? editing.content : reply?.content}</small>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setReply(null);
                    setEditing(null);
                    setText("");
                  }}
                >
                  ×
                </button>
              </div>
            )}
            <textarea
              ref={textarea}
              value={text}
              maxLength={4000}
              placeholder={`Mensaje para ${data?.channels.find((item) => item.id === channel)?.display_name || "general"}`}
              onChange={(e) => updateText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  e.currentTarget.form?.requestSubmit();
                }
              }}
            />
            {mentionQuery !== undefined && (
              <div className="mention-menu">
                {data?.users
                  .filter((user) =>
                    user.name.toLowerCase().includes(mentionQuery),
                  )
                  .slice(0, 5)
                  .map((user) => (
                    <button
                      type="button"
                      key={user.id}
                      onClick={() => chooseMention(user)}
                    >
                      <span className="avatar">
                        {user.name.slice(0, 2).toUpperCase()}
                      </span>
                      <span>
                        <b>{user.name}</b>
                        <small>{user.email}</small>
                      </span>
                    </button>
                  ))}
              </div>
            )}
            <div>
              <span>
                Usa <b>@nombre</b> para mencionar · Shift + Enter para otra
                línea
              </span>
              <button className="admin-primary" disabled={!text.trim()}>
                Enviar
              </button>
            </div>
          </form>
        </div>
      </section>
      {directPicker&&<div className="modal-backdrop"><section className="workspace-modal direct-picker"><header><div><h2>Nuevo mensaje</h2><p>Elige una persona para abrir una conversación privada.</p></div><button onClick={()=>setDirectPicker(false)}>×</button></header><div>{data?.users.filter(member=>member.id!==data.currentUser.id).map(member=><button key={member.id} onClick={async()=>{const response=await fetch("/api/admin/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"direct",memberId:member.id})}),result=await response.json();if(!response.ok){setError(result.error);return}setDirectPicker(false);setChannel(result.item.id);await load(result.item.id)}}><span className="avatar">{member.name.slice(0,2).toUpperCase()}</span><span><b>{member.name}</b><small>{member.email}</small></span><ChevronRight size={18}/></button>)}</div></section></div>}
      {(newChannel || editingChannel) && (
        <div className="modal-backdrop">
          <section className="workspace-modal">
            <header>
              <h2>{editingChannel ? "Editar canal" : "Nuevo canal"}</h2>
              <button onClick={() => {setNewChannel(false);setEditingChannel(null)}}>×</button>
            </header>
            <form
              className="workspace-form"
              onSubmit={async (e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget),
                  response = await fetch("/api/admin/chat", {
                    method: editingChannel ? "PATCH" : "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      action: "channel",
                      id: editingChannel?.id,
                      name: f.get("name"),
                      description: f.get("description"),
                    }),
                  }),
                  result = await response.json();
                if (!response.ok) {
                  setError(result.error);
                  return;
                }
                setNewChannel(false);setEditingChannel(null);
                await load(result.item.id);
                setChannel(result.item.id);
              }}
            >
              <label>
                Nombre
                <input
                  name="name"
                  defaultValue={editingChannel?.name || ""}
                  required
                  maxLength={80}
                  placeholder="Ej. Producto"
                />
              </label>
              <label>
                Descripción
                <input
                  name="description"
                  defaultValue={editingChannel?.description || ""}
                  maxLength={220}
                  placeholder="¿De qué se habla aquí?"
                />
              </label>
              <footer className="form-actions full">
                {editingChannel && editingChannel.slug !== "general" && <button type="button" className="danger-button" onClick={()=>void deleteChannel(editingChannel)}><Trash2 size={16}/> Eliminar canal</button>}
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {setNewChannel(false);setEditingChannel(null)}}
                >
                  Cancelar
                </button>
                <button className="admin-primary">{editingChannel ? "Guardar cambios" : "Crear canal"}</button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
