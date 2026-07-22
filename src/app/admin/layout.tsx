import { redirect } from "next/navigation";
import { AppNavigation } from "@/components/app-navigation";
import { AdminPasswordLogin } from "@/components/admin-password-login";
import { currentUserFromPage } from "@/lib/services/auth";

export const dynamic = "force-dynamic";
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUserFromPage();
  if (!user) {
    return <><AppNavigation /><main className="auth-shell auth-shell-admin"><section className="admin-login-card"><AdminPasswordLogin /></section></main></>;
  }
  if (user.role === "member") redirect("/app");
  const initials = `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`;
  return <div className="app-shell"><AppNavigation user={{ displayName: user.displayName, company: user.company, initials }} showAdmin logoutRedirect="/admin" />{children}</div>;
}
