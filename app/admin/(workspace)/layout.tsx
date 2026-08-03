import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-session";
import { WorkspaceShell } from "../workspace-shell";
import "../workspace.css";
import "../chat-enhancements.css";
import { WorkspaceProvider } from "../workspace-store";
import { RealtimeProvider } from "../realtime-provider";

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getAdminSession();
  if (!user) redirect("/admin/login");
  return <><link rel="preconnect" href="https://fonts.googleapis.com"/><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..24,400,0,0&display=optional"/><RealtimeProvider enabled={Boolean(process.env.ABLY_API_KEY)} user={user}><WorkspaceProvider><WorkspaceShell user={user}>{children}</WorkspaceShell></WorkspaceProvider></RealtimeProvider></>;
}
