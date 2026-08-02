export const navItems = [
  ["Dashboard", "/admin", "⌂"], ["Workspace", "/admin/workspace", "◇"], ["Kanban", "/admin/kanban", "▦"], ["Product Backlog", "/admin/backlog", "≡"], ["Sprint Backlog", "/admin/sprint-backlog", "☷"], ["Sprint", "/admin/sprint", "◷"], ["Equipo", "/admin/equipo", "◎"], ["Calendario", "/admin/calendario", "□"], ["Documentación", "/admin/documentacion", "▤"], ["Configuración", "/admin/configuracion", "⚙"], ["Perfil", "/admin/perfil", "○"],
] as const;

export const tasks = [
  { id: "MW-21", title: "Flujo de onboarding empresarial", state: "Ideas", owner: "Amy", priority: "Media", tag: "Producto", due: "12 Ago", progress: 10 },
  { id: "MW-18", title: "Modelo de permisos por organización", state: "Backlog", owner: "Daniel", priority: "Alta", tag: "Arquitectura", due: "8 Ago", progress: 20 },
  { id: "MW-14", title: "Sistema visual de Workspace", state: "Sprint actual", owner: "Sarah", priority: "Alta", tag: "Diseño", due: "5 Ago", progress: 65 },
  { id: "MW-11", title: "Dashboard operativo", state: "En desarrollo", owner: "Jowell", priority: "Alta", tag: "Frontend", due: "4 Ago", progress: 72 },
  { id: "MW-09", title: "Autenticación administrativa", state: "Code Review", owner: "Daniel", priority: "Crítica", tag: "Seguridad", due: "3 Ago", progress: 85 },
  { id: "MW-07", title: "Pruebas del formulario de contacto", state: "Testing", owner: "Amy", priority: "Media", tag: "QA", due: "2 Ago", progress: 90 },
  { id: "MW-03", title: "Landing pública Meridian", state: "Completado", owner: "Jowell", priority: "Alta", tag: "Web", due: "1 Ago", progress: 100 },
];

export const team = [
  { name: "Daniel", initials: "DJ", role: "Product Owner · Tech Lead", load: 82, done: 18, pending: 5, availability: "Disponible" },
  { name: "Amy", initials: "AR", role: "Business Analyst", load: 64, done: 13, pending: 4, availability: "Disponible" },
  { name: "Sarah", initials: "SH", role: "UX/UI Designer", load: 71, done: 11, pending: 3, availability: "En foco" },
  { name: "Jowell", initials: "JW", role: "Frontend Developer", load: 88, done: 16, pending: 6, availability: "En foco" },
];
