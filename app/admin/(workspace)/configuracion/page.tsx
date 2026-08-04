"use client";

import Link from "next/link";
import { Bell, CalendarDays, Code2, Contrast, ExternalLink, Play, Upload, UsersRound, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { defaultPreferences, playNotificationSound, type WorkspacePreferences } from "../../notification-sound";

const read = (): WorkspacePreferences => {
  try { return { ...defaultPreferences, ...JSON.parse(localStorage.getItem("meridian-preferences") || "{}") }; }
  catch { return defaultPreferences; }
};

export default function SettingsPage() {
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [notice, setNotice] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { const timer = window.setTimeout(() => setPreferences(read()), 0); return () => window.clearTimeout(timer); }, []);

  const save = (next: WorkspacePreferences, message = "Preferencia guardada") => {
    setPreferences(next);
    try {
      localStorage.setItem("meridian-preferences", JSON.stringify(next));
      window.dispatchEvent(new CustomEvent("meridian-preferences", { detail: next }));
      setNotice(message);
    } catch { setNotice("El archivo es demasiado grande para guardarlo en este dispositivo."); }
  };
  const update = (key: keyof WorkspacePreferences, value: boolean) => save({ ...preferences, [key]: value });
  const chooseSound = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("audio/")) { setNotice("Selecciona un archivo de audio válido."); return; }
    if (file.size > 1_500_000) { setNotice("El sonido debe pesar menos de 1.5 MB."); return; }
    const reader = new FileReader();
    reader.onload = () => save({ ...preferences, sounds: true, soundName: file.name, soundData: String(reader.result) }, "Sonido personalizado guardado");
    reader.onerror = () => setNotice("No pudimos leer ese archivo de audio.");
    reader.readAsDataURL(file);
  };
  const resetSound = () => {
    const { soundName: _soundName, soundData: _soundData, ...rest } = preferences;
    save(rest, "Sonido predeterminado restaurado");
  };
  const notifications = async () => {
    if (!("Notification" in window)) { setNotice("Este navegador no admite notificaciones."); return; }
    const permission = await Notification.requestPermission();
    setNotice(permission === "granted" ? "Notificaciones activadas" : "No se concedió permiso para notificaciones");
  };

  return <>
    <div className="workspace-heading"><div><span className="admin-eyebrow">Administración</span><h1>Configuración</h1><p>Preferencias reales del Workspace e integraciones del equipo.</p></div>{notice && <span className="settings-saved">{notice}</span>}</div>
    <div className="settings-sections">
      <section className="workspace-panel"><header><span><Contrast size={20}/><b>Apariencia</b></span></header><div className="settings-controls"><Toggle label="Modo oscuro obsidiana" text="Usa una interfaz negra de alto contraste en todo el Workspace." checked={preferences.monochrome} onChange={value => update("monochrome", value)}/><Toggle label="Vista compacta" text="Reduce espacios para mostrar más información." checked={preferences.compact} onChange={value => update("compact", value)}/><Toggle label="Reducir movimiento" text="Desactiva animaciones y transiciones." checked={preferences.reducedMotion} onChange={value => update("reducedMotion", value)}/></div></section>
      <section className="workspace-panel"><header><span><Bell size={20}/><b>Notificaciones</b></span></header><div className="settings-controls"><Toggle label="Sonidos del chat" text="Reproduce una alerta al recibir mensajes." checked={preferences.sounds} onChange={value => update("sounds", value)}/><article className="notification-sound-setting"><span><b>Sonido de notificación</b><small>{preferences.soundName || "Alerta Meridian · predeterminada"}</small></span><div className="sound-actions"><button className="sound-preview" onClick={() => playNotificationSound(preferences.soundData)} aria-label="Probar sonido" title="Probar sonido"><Play size={16}/></button><input ref={fileRef} type="file" accept="audio/*" hidden onChange={event => { chooseSound(event.target.files?.[0]); event.target.value = ""; }}/><button className="secondary-button" onClick={() => fileRef.current?.click()}><Upload size={15}/> Elegir audio</button>{preferences.soundData && <button className="sound-reset" onClick={resetSound} aria-label="Usar sonido predeterminado" title="Usar sonido predeterminado"><X size={16}/></button>}</div></article><article><span><b>Notificaciones del navegador</b><small>Recibe mensajes aunque tengas otra pestaña abierta.</small></span><button className="secondary-button" onClick={notifications}>Activar</button></article></div></section>
      <section className="workspace-panel"><header><span><UsersRound size={20}/><b>Equipo y permisos</b></span></header><div className="settings-controls"><article><span><b>Usuarios del Workspace</b><small>Gestiona miembros, roles, disponibilidad y carga.</small></span><Link className="secondary-button" href="/admin/equipo">Administrar</Link></article><article><span><b>Perfil y seguridad</b><small>Consulta el rol y la sesión de tu cuenta.</small></span><Link className="secondary-button" href="/admin/perfil">Abrir perfil</Link></article></div></section>
      <section className="workspace-panel"><header><span><CalendarDays size={20}/><b>Integraciones</b></span></header><div className="settings-controls"><article><span><b>Google Calendar</b><small>Importa/exporta calendarios y añade eventos a Google.</small></span><Link className="secondary-button" href="/admin/calendario">Configurar</Link></article><article><span><b>GitHub</b><small>Repositorio público de Meridian.</small></span><a className="secondary-button" href="https://github.com/DaniDRK20/meridian-landing-page" target="_blank" rel="noreferrer"><Code2 size={16}/> Abrir</a></article><article><span><b>Figma</b><small>Abre el espacio de diseño para conectar un archivo.</small></span><a className="secondary-button" href="https://www.figma.com/files" target="_blank" rel="noreferrer"><ExternalLink size={15}/> Abrir</a></article><article><span><b>Slack y Discord</b><small>Las alertas externas requieren un webhook del equipo.</small></span><a className="secondary-button" href="https://api.slack.com/apps" target="_blank" rel="noreferrer"><ExternalLink size={15}/> Configurar</a></article></div></section>
    </div>
  </>;
}

function Toggle({ label, text, checked, onChange }: { label: string; text: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <article><span><b>{label}</b><small>{text}</small></span><label className="settings-toggle"><input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)}/><i/><span>{checked ? "Sí" : "No"}</span></label></article>;
}
