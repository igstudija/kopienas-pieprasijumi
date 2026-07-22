import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { Brand } from "@/components/brand";
import { LanguageSwitcher } from "@/components/language-provider";
import { LoginChoices } from "@/components/login-choices";
import { installationStatus } from "@/lib/services/installation";
import { globalMessages, parseLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const status = await installationStatus();
  if (!status.installed) redirect("/setup");
  const messages = globalMessages[parseLocale((await cookies()).get("community_locale")?.value)];

  return <main className="auth-shell"><div className="auth-brand"><Brand /></div><div className="auth-language"><LanguageSwitcher compact /></div><section className="auth-card"><span className="auth-step">{messages.loginEyebrow}</span><h1>{messages.loginTitleFirst}<br />{messages.loginTitleSecond}</h1><p className="desktop-login-copy">{messages.loginDesktop}</p><p className="mobile-login-copy">{messages.loginMobile}</p><LoginChoices /></section><aside className="auth-aside"><blockquote>{messages.loginQuote}</blockquote><span>{messages.loginQuoteAuthor}</span></aside></main>;
}
