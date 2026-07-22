import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { AppNavigation } from "@/components/app-navigation";
import { LoginChoices } from "@/components/login-choices";
import { installationStatus } from "@/lib/services/installation";
import { globalMessages, parseLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const status = await installationStatus();
  if (!status.installed) redirect("/setup");
  const messages = globalMessages[parseLocale((await cookies()).get("community_locale")?.value)];

  return <><AppNavigation /><main className="auth-shell auth-shell-home"><section className="auth-card"><h1>{messages.loginTitleFirst}<br />{messages.loginTitleSecond}</h1><p className="desktop-login-copy">{messages.loginDesktop}</p><p className="mobile-login-copy">{messages.loginMobile}</p><LoginChoices /></section><aside className="auth-aside"><blockquote>{messages.loginQuote}</blockquote></aside></main></>;
}
