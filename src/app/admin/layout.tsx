import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { Brand } from "@/components/brand";
import { AppNavigation } from "@/components/app-navigation";
import { AdminPasswordLogin } from "@/components/admin-password-login";
import { AdminSectionNav } from "@/components/admin-section-nav";
import { currentUserFromPage } from "@/lib/services/auth";
import { parseLocale } from "@/lib/i18n";
import { adminCopy } from "@/lib/admin-i18n";

export const dynamic = "force-dynamic";
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUserFromPage();
  const locale = parseLocale((await cookies()).get("community_locale")?.value);
  if (!user) {
    const copy = adminCopy[locale];
    return <main className="auth-shell"><div className="auth-brand"><Brand /></div><section className="auth-card"><span className="auth-step">{copy.authEyebrow}</span><h1>{copy.authTitle}</h1><p>{copy.authIntro}</p><AdminPasswordLogin /></section><aside className="auth-aside"><blockquote>{copy.authQuote}</blockquote><span>{copy.authQuoteBy}</span></aside></main>;
  }
  if (user.role === "member") redirect("/app");
  const initials = `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`;
  return <div className="app-shell"><AppNavigation user={{ displayName: user.displayName, company: user.company, initials }} showAdmin logoutRedirect="/admin" /><AdminSectionNav />{children}</div>;
}
