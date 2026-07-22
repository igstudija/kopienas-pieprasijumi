import type { Metadata } from "next";
import { cookies } from "next/headers";
import { LegalPageNav } from "@/components/legal-page-nav";
import { parseLocale } from "@/lib/i18n";
import { legalCopy } from "@/lib/legal-copy";
import { currentUserFromPage } from "@/lib/services/auth";
import { getLegalSettings } from "@/lib/services/legal-settings";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Privacy and cookies" };

export default async function PrivacyPage() {
  const locale = parseLocale((await cookies()).get("community_locale")?.value);
  const copy = legalCopy[locale];
  const [settings, user] = await Promise.all([getLegalSettings(), currentUserFromPage()]);
  const privacyEmail = settings.privacyContactEmail || settings.legalEmail;
  const navUser = user ? { displayName: user.displayName, company: user.company, initials: `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`, showAdmin: user.role !== "member" } : undefined;
  return (
    <main className="legal-page">
      <LegalPageNav user={navUser} />
      <header className="legal-hero"><p>{copy.privacy.intro}</p><small>{copy.updated}</small></header>
      <article className="legal-content privacy-content">
        <section className="legal-card"><h2>{copy.privacy.controller}</h2><p>{copy.privacy.controllerText}</p><dl className="legal-facts compact"><div><dt>{copy.impressum.entity}</dt><dd>{settings.legalEntityName || copy.notProvided}</dd></div><div><dt>{copy.impressum.address}</dt><dd>{settings.legalAddress || copy.notProvided}</dd></div><div><dt>{copy.privacy.privacyContact}</dt><dd>{privacyEmail ? <a href={`mailto:${privacyEmail}`}>{privacyEmail}</a> : copy.notProvided}</dd></div></dl></section>
        <LegalSection title={copy.privacy.dataText ? copy.privacy.data : ""} text={copy.privacy.dataText} />
        <LegalSection title={copy.privacy.purposes} text={copy.privacy.purposesText} />
        <LegalSection title={copy.privacy.access} text={copy.privacy.accessText} />
        <LegalSection title={copy.privacy.whatsapp} text={copy.privacy.whatsappText} />
        <section><h2>{copy.privacy.cookies}</h2><p>{copy.privacy.cookiesText}</p><ul><li>{copy.privacy.cookieSession}</li><li>{copy.privacy.cookieLocale}</li><li>{copy.privacy.localStorage}</li></ul><p className="legal-note">{copy.privacy.noAnalytics}</p></section>
        <LegalSection title={copy.privacy.retention} text={copy.privacy.retentionText(settings.dataRetentionMonths)} />
        <LegalSection title={copy.privacy.providers} text={copy.privacy.providersText} />
        <LegalSection id="data-deletion" title={copy.privacy.rights} text={copy.privacy.rightsText} />
        <LegalSection title={copy.privacy.complaints} text={copy.privacy.complaintsText} />
        <LegalSection title={copy.privacy.security} text={copy.privacy.securityText} />
        <LegalSection title={copy.privacy.changes} text={copy.privacy.changesText} />
      </article>
    </main>
  );
}

function LegalSection({ id, title, text }: { id?: string; title: string; text: string }) {
  return <section id={id}><h2>{title}</h2><p>{text}</p></section>;
}
