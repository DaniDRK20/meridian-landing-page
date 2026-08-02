import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-session";
import { WorkspaceShell } from "../workspace-shell";
import "../workspace.css";
import { WorkspaceProvider } from "../workspace-store";
import { RealtimeProvider } from "../realtime-provider";

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getAdminSession();
  if (!user) redirect("/admin/login");
  return <RealtimeProvider enabled={Boolean(process.env.ABLY_API_KEY)}><WorkspaceProvider><WorkspaceShell user={user}>{children}</WorkspaceShell></WorkspaceProvider></RealtimeProvider>;
}
