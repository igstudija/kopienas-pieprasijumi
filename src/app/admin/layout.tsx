import { redirect } from "next/navigation";
import { AppNavigation } from "@/components/app-navigation";
import { currentUserFromPage } from "@/lib/services/auth";

export const dynamic = "force-dynamic";
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUserFromPage();
  if (!user) redirect("/");
  if (user.role === "member") redirect("/");
  const initials = `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`;
  return <div className="app-shell"><AppNavigation user={{ displayName: user.displayName, company: user.company, initials }} showAdmin />{children}</div>;
}
