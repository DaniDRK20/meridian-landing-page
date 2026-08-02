import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-session";
import { WorkspaceShell } from "../workspace-shell";
import "../workspace.css";

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getAdminSession();
  if (!user) redirect("/admin/login");
  return <WorkspaceShell user={user}>{children}</WorkspaceShell>;
}
