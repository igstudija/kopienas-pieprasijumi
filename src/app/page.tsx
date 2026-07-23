import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { AppNavigation } from "@/components/app-navigation";
import { DashboardClient } from "@/components/dashboard-client";
import { EmailLoginForm } from "@/components/email-login-form";
import { currentUserFromPage } from "@/lib/services/auth";
import { installationStatus } from "@/lib/services/installation";
import { globalMessages, parseLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const status = await installationStatus();
  if (!status.installed) redirect("/setup");
  const user = await currentUserFromPage();
  if (user) {
    const initials = `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`;
    return (
      <div className="app-shell">
        <AppNavigation
          user={{ displayName: user.displayName, company: user.company, initials }}
          showAdmin={user.role !== "member"}
        />
        <DashboardClient />
      </div>
    );
  }
  const messages = globalMessages[parseLocale((await cookies()).get("community_locale")?.value)];

  return <><AppNavigation /><main className="auth-shell auth-shell-home"><section className="auth-card"><h1>{messages.loginTitleFirst}<br />{messages.loginTitleSecond}</h1><p>{messages.loginIntro}</p><EmailLoginForm developmentLogin={process.env.NODE_ENV === "development"} /></section><aside className="auth-aside"><blockquote>{messages.loginQuote}</blockquote></aside></main></>;
}
