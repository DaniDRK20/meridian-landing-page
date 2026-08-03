import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-session";
import { WorkspaceShell } from "../workspace-shell";
import "../workspace.css";
import "../chat-enhancements.css";
import "../workspace-features.css";
import "../workspace-dark.css";
import "../google-calendar.css";
import { WorkspaceProvider } from "../workspace-store";
import { RealtimeProvider } from "../realtime-provider";
import type {Metadata} from "next";

export const metadata:Metadata={robots:{index:false,follow:false}};

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getAdminSession();
  if (!user) redirect("/admin/login");
  return <RealtimeProvider enabled={Boolean(process.env.ABLY_API_KEY)} user={user}><WorkspaceProvider><WorkspaceShell user={user}>{children}</WorkspaceShell></WorkspaceProvider></RealtimeProvider>;
}
