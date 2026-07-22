import Link from "next/link";
import { redirect } from "next/navigation";
import { Brand } from "@/components/brand";
import { LogoutButton } from "@/components/logout-button";
import { currentUserFromPage } from "@/lib/services/auth";

export const dynamic = "force-dynamic";
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUserFromPage();
  if (!user) redirect("/login");
  if (user.role === "member") redirect("/app");
  const initials = `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`;
  return <div className="app-shell"><nav className="app-nav"><Brand /><div className="app-nav-links"><Link href="/app">Pieprasījumi</Link><Link href="/admin">Administrācija</Link><div className="user-chip"><span className="avatar">{initials}</span><span><b>{user.displayName}</b><small>{user.company}</small></span></div><LogoutButton /></div></nav>{children}</div>;
}
