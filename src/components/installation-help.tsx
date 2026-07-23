import { AppNavigation } from "@/components/app-navigation";
import { vercelDeployUrl } from "@/lib/vercel-deploy";

const repositoryUrl = process.env.NEXT_PUBLIC_TEMPLATE_REPOSITORY_URL
  ?? (process.env.VERCEL_GIT_REPO_OWNER && process.env.VERCEL_GIT_REPO_SLUG
    ? `https://github.com/${process.env.VERCEL_GIT_REPO_OWNER}/${process.env.VERCEL_GIT_REPO_SLUG}`
    : undefined);

export function InstallationHelp() {
  const deployUrl = repositoryUrl ? vercelDeployUrl(repositoryUrl) : null;

  return (
    <main className="help-page">
      <AppNavigation title="Installation help" installationMode />
      <header className="help-hero">
        <span className="auth-step">Vercel + Supabase + SMTP</span>
        <h1>Deploy your own<br />independent installation.</h1>
        <p>Every community owns its GitHub repository, Vercel project, Supabase database, email provider account and data. There is no shared application server or central customer database.</p>
        {deployUrl
          ? <a className="button button-accent" href={deployUrl}>1. Deploy the application</a>
          : <div className="setup-warning">The template distributor must configure <code>NEXT_PUBLIC_TEMPLATE_REPOSITORY_URL</code> with the public GitHub repository URL.</div>}
      </header>

      <section className="help-options">
        <article className="help-option recommended">
          <span>Step 1</span><h2>Deploy the GitHub copy</h2>
          <ol>
            <li>Open the deployment button and sign in to Vercel.</li>
            <li>Choose the GitHub account that will own the new repository copy.</li>
            <li>Enter a unique value of at least 12 characters for <code>SETUP_SECRET</code>.</li>
            <li>Deploy. The first build is allowed to finish before a database is connected.</li>
            <li>Keep the generated Vercel project open for the next step.</li>
          </ol>
        </article>
        <article className="help-option">
          <span>Step 2</span><h2>Connect a Supabase database</h2>
          <ol>
            <li>In the Vercel project, open <b>Storage</b> or <b>Integrations</b> and select Supabase.</li>
            <li>Create a new Supabase project or connect one that belongs to this community.</li>
            <li>Connect the database to the Vercel project and confirm the environment-variable access.</li>
            <li>Check that <code>POSTGRES_URL</code> or <code>DATABASE_URL</code> exists in Project Settings → Environment Variables.</li>
            <li>Redeploy. The build now applies all committed database migrations before building the application.</li>
          </ol>
        </article>
        <article className="help-option">
          <span>Step 3</span><h2>Complete the first-run wizard</h2>
          <ol>
            <li>Open the production URL. An empty installation redirects to <code>/setup</code>.</li>
            <li>Enter the community name, time zone and installation-wide interface language.</li>
            <li>Connect Brevo, Mailjet or a custom SMTP provider.</li>
            <li>Create the owner account and enter the same <code>SETUP_SECRET</code>.</li>
            <li>The wizard sends a real test email before saving the installation.</li>
          </ol>
        </article>
      </section>

      <section className="help-detail">
        <div><span className="section-number">Database</span><h2>Using an existing Supabase project</h2></div>
        <div className="help-facts">
          <p><b>Recommended connection</b><span>Connect the existing Supabase project through the Vercel Marketplace so its PostgreSQL variables stay synchronized with the Vercel project.</span></p>
          <p><b>Manual connection</b><span>Add the pooled PostgreSQL connection string as <code>DATABASE_URL</code>, <code>POSTGRES_URL</code> or <code>POSTGRES_PRISMA_URL</code>.</span></p>
          <p><b>Migration behavior</b><span>A Vercel build runs migrations only when a supported database variable is available. Without one, the deployment remains available so this help page can explain the missing step.</span></p>
          <p><b>Environment scope</b><span>Use a separate database for Production and Preview unless you explicitly accept preview deployments changing production data.</span></p>
        </div>
      </section>

      <section className="help-detail email-help">
        <div><span className="section-number">Email</span><h2>Prepare SMTP before the wizard</h2></div>
        <div className="help-facts">
          <p><b>Provider account</b><span>Create a Brevo or Mailjet account, or obtain SMTP credentials from another provider.</span></p>
          <p><b>Verified sender</b><span>Verify the sender email or domain. Configure SPF and DKIM before inviting members.</span></p>
          <p><b>Dedicated key</b><span>Copy the SMTP login and a dedicated SMTP key. Do not use the password of your normal email account.</span></p>
          <p><b>Delivery test</b><span>The wizard sends a real message to the owner. Installation data is saved only after this test succeeds.</span></p>
        </div>
      </section>

      <section className="help-detail">
        <div><span className="section-number">Security</span><h2>Where credentials are stored</h2></div>
        <div className="help-facts">
          <p><b>Database credentials</b><span>Vercel Environment Variables. They are not committed to GitHub or exposed to the browser.</span></p>
          <p><b>Installation secret</b><span>Vercel Environment Variables. The wizard verifies it but does not copy it into the database.</span></p>
          <p><b>SMTP credentials</b><span>AES-GCM encrypted in this installation&apos;s database and never returned by the administration API.</span></p>
          <p><b>Federation private key and phone numbers</b><span>AES-GCM encrypted in the installation database.</span></p>
          <p><b>Magic-link and session tokens</b><span>Only HMAC digests are stored. Raw session tokens exist only in HttpOnly cookies.</span></p>
        </div>
      </section>

      <section className="help-detail">
        <div><span className="section-number">More</span><h2>Detailed operator documentation</h2></div>
        <div className="help-facts">
          <p><b>Installation and troubleshooting</b><span><a href={`${repositoryUrl ?? "https://github.com/igstudija/kopienas-pieprasijumi"}/blob/main/docs/INSTALLATION.md`} target="_blank" rel="noreferrer">Open the complete installation guide ↗</a></span></p>
          <p><b>Upgrades, backups and recovery</b><span><a href={`${repositoryUrl ?? "https://github.com/igstudija/kopienas-pieprasijumi"}/blob/main/docs/OPERATIONS.md`} target="_blank" rel="noreferrer">Open the operations guide ↗</a></span></p>
          <p><b>Official platform documentation</b><span><a href="https://vercel.com/marketplace/supabase/supabase" target="_blank" rel="noreferrer">Vercel Supabase integration ↗</a> · <a href="https://supabase.com/docs/guides/integrations/vercel-marketplace" target="_blank" rel="noreferrer">Supabase Marketplace guide ↗</a></span></p>
        </div>
      </section>
    </main>
  );
}
