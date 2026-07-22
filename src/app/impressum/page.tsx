import type { Metadata } from "next";
import { cookies } from "next/headers";
import { LegalPageNav } from "@/components/legal-page-nav";
import { parseLocale } from "@/lib/i18n";
import { legalCopy } from "@/lib/legal-copy";
import { LICENSE_NAME, SOURCE_CODE_URL } from "@/lib/legal-settings";
import { getLegalSettings } from "@/lib/services/legal-settings";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Impressum" };

export default async function ImpressumPage() {
  const locale = parseLocale((await cookies()).get("community_locale")?.value);
  const copy = legalCopy[locale];
  const settings = await getLegalSettings();
  const value = (input: string) => input || copy.notProvided;
  return (
    <main className="legal-page">
      <LegalPageNav />
      <header className="legal-hero"><p>{copy.impressum.intro}</p><small>{copy.updated}</small></header>
      <div className="legal-content">
        <section className="legal-card"><h2>{copy.impressum.operator}</h2><dl className="legal-facts"><div><dt>{copy.impressum.entity}</dt><dd>{value(settings.legalEntityName)}</dd></div><div><dt>{copy.impressum.registration}</dt><dd>{value(settings.legalRegistrationNumber)}</dd></div><div><dt>{copy.impressum.address}</dt><dd>{value(settings.legalAddress)}</dd></div><div><dt>{copy.impressum.country}</dt><dd>{value(settings.legalCountry)}</dd></div><div><dt>{copy.impressum.email}</dt><dd>{settings.legalEmail ? <a href={`mailto:${settings.legalEmail}`}>{settings.legalEmail}</a> : copy.notProvided}</dd></div><div><dt>{copy.impressum.phone}</dt><dd>{value(settings.legalPhone)}</dd></div></dl></section>
        <section><h2>{copy.impressum.solution}</h2><p>{copy.impressum.solutionText}</p></section>
        <section><h2>{copy.impressum.independence}</h2><p>{copy.impressum.independenceText}</p></section>
        <section><h2>{copy.impressum.source}</h2><p>{copy.impressum.sourceText}</p><a className="legal-source-link" href={SOURCE_CODE_URL} target="_blank" rel="noreferrer">{SOURCE_CODE_URL}</a></section>
        <section><h2>{copy.impressum.license}</h2><p>{copy.impressum.licenseText}</p><strong className="license-badge">{LICENSE_NAME}</strong></section>
        <section><h2>{copy.impressum.warranty}</h2><p>{copy.impressum.warrantyText}</p></section>
      </div>
    </main>
  );
}
