import Link from "next/link";
import { Brand } from "@/components/brand";
import { vercelDeployUrl } from "@/lib/vercel-deploy";

const repositoryUrl = process.env.NEXT_PUBLIC_TEMPLATE_REPOSITORY_URL
  ?? (process.env.VERCEL_GIT_REPO_OWNER && process.env.VERCEL_GIT_REPO_SLUG
    ? `https://github.com/${process.env.VERCEL_GIT_REPO_OWNER}/${process.env.VERCEL_GIT_REPO_SLUG}`
    : undefined);

export default function InstallationHelpPage() {
  const deployUrl = repositoryUrl ? vercelDeployUrl(repositoryUrl) : null;

  return (
    <main className="help-page">
      <nav className="help-nav"><Brand /><Link href="/setup">Atgriezties vednī</Link></nav>
      <header className="help-hero">
        <span className="auth-step">Vercel + Supabase</span>
        <h1>Neatkarīga instalācija<br />bez servera administrēšanas.</h1>
        <p>Katrai grupai ir sava koda kopija, savs Vercel projekts un sava Supabase datubāze. Neviena instalācija nav atkarīga no centrāla aplikācijas servera.</p>
        {deployUrl ? <a className="button button-accent" href={deployUrl}>Sākt ieteikto instalāciju</a> : <div className="setup-warning">Izplatītājam vēl jākonfigurē publiskā GitHub šablona adrese <code>NEXT_PUBLIC_TEMPLATE_REPOSITORY_URL</code>.</div>}
      </header>

      <section className="help-options">
        <article className="help-option recommended">
          <span>Ieteicamais variants</span><h2>Viena Vercel instalācijas poga</h2>
          <ol>
            <li>Pieslēdzies Vercel un izvēlies, kurā GitHub kontā izveidot savu projekta kopiju.</li>
            <li>Izvēlies instalācijas paroli laukam <code>SETUP_SECRET</code>.</li>
            <li>Apstiprini Supabase produktu, plānu un datubāzes reģionu.</li>
            <li>Vercel pieslēdz Supabase credentials un publicē aplikāciju.</li>
            <li>Atver aplikāciju un izpildi pirmās palaišanas vedni.</li>
          </ol>
        </article>
        <article className="help-option">
          <span>Ja Supabase solis neparādās</span><h2>Pieslēgšana Vercel panelī</h2>
          <ol>
            <li>Vispirms publicē GitHub kopiju Vercel.</li>
            <li>Vercel projektā atver <b>Storage → Create Database → Supabase</b>.</li>
            <li>Izveido Supabase projektu un savieno to ar šo Vercel projektu.</li>
            <li>Project Settings → Environment Variables pievieno <code>SETUP_SECRET</code>.</li>
            <li>Veic <b>Redeploy</b> un atver <code>/setup</code>.</li>
          </ol>
        </article>
        <article className="help-option">
          <span>Esošs Supabase projekts</span><h2>Manuāla pieslēgšana</h2>
          <ol>
            <li>Importē savu GitHub kopiju Vercel.</li>
            <li>Pievieno <code>DATABASE_URL</code> vai <code>POSTGRES_URL</code> ar Supabase pooled connection string.</li>
            <li>Pievieno <code>SUPABASE_SECRET_KEY</code> un savu <code>SETUP_SECRET</code>.</li>
            <li>Publicē atkārtoti. Build laikā automātiski izpildīsies datubāzes migrācijas.</li>
            <li>Pabeidz konfigurāciju aplikācijas vednī.</li>
          </ol>
        </article>
      </section>

      <section className="help-detail">
        <div><span className="section-number">Drošība</span><h2>Kur paliek credentials?</h2></div>
        <div className="help-facts">
          <p><b>Datubāzes credentials</b><span>Vercel Environment Variables. Tie nenonāk GitHub vai pārlūkā.</span></p>
          <p><b>Meta App Secret</b><span>Vednis to šifrē pirms saglabāšanas konkrētās instances Supabase datubāzē.</span></p>
          <p><b>Federācijas privātā atslēga</b><span>Tiek ģenerēta vednī un šifrēta konkrētās instances datubāzē.</span></p>
          <p><b>Instalācijas parole</b><span>Glabājas tikai Vercel; vednis to pārbauda un nekad neieraksta datubāzē.</span></p>
        </div>
      </section>

      <section className="help-detail whatsapp-help">
        <div><span className="section-number">WhatsApp</span><h2>Kas jāsagatavo Meta pusē?</h2></div>
        <div className="help-facts">
          <p><b>1. Meta aplikācija</b><span>Izveido Business tipa aplikāciju un pievieno WhatsApp produktu.</span></p>
          <p><b>2. Grupas numurs</b><span>Pieslēdz WhatsApp Business numuru, uz kuru biedri sūtīs autorizācijas ziņu.</span></p>
          <p><b>3. App Secret</b><span>Nokopē to vedņa WhatsApp solī. Pārlūkā tas netiks rādīts atkārtoti.</span></p>
          <p><b>4. Webhook</b><span>Pēc instalācijas nokopē Callback URL un Verify token, pēc tam abonē <code>messages</code>.</span></p>
        </div>
      </section>
    </main>
  );
}
