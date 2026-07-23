import { AuthenticatedAppShell } from "@/components/authenticated-app-shell";

export const dynamic = "force-dynamic";

const repositoryUrl = process.env.NEXT_PUBLIC_TEMPLATE_REPOSITORY_URL
  ?? "https://github.com/igstudija/kopienas-pieprasijumi";

export default function AdminHelpPage() {
  return (
    <AuthenticatedAppShell administratorOnly>
      <main className="app-main admin-help-page">
        <p className="admin-help-intro">Operator guidance for maintaining this independent installation. This section is available only to administrators and owners.</p>

        <section className="admin-help-grid">
          <article className="data-card admin-help-card">
            <h2>Members and access</h2>
            <div>
              <p>Add members manually or import up to 500 records from Excel or CSV. Email is the sign-in identity; changing it revokes active sessions.</p>
              <a href="/admin">Manage members</a>
            </div>
          </article>

          <article className="data-card admin-help-card">
            <h2>Email authentication</h2>
            <div>
              <p>Configure Brevo, Mailjet or custom SMTP, verify the sender domain, and send a real delivery test before inviting members.</p>
              <a href="/admin/email">Open email settings</a>
            </div>
          </article>

          <article className="data-card admin-help-card">
            <h2>Connected installations</h2>
            <div>
              <p>Each accepted pairing code grants one-way access. Both installations must exchange codes for two-way request sharing.</p>
              <a href="/admin/federation">Manage connections</a>
            </div>
          </article>

          <article className="data-card admin-help-card">
            <h2>Language and instance settings</h2>
            <div>
              <p>The selected language applies to every member, administrator and system email in this installation.</p>
              <a href="/admin/settings">Open instance settings</a>
            </div>
          </article>

          <article className="data-card admin-help-card">
            <h2>Privacy and legal information</h2>
            <div>
              <p>Enter the actual data-controller details and review the default privacy copy before processing real member data.</p>
              <a href="/admin/legal">Open legal settings</a>
            </div>
          </article>

          <article className="data-card admin-help-card">
            <h2>Installation and recovery</h2>
            <div>
              <p>Use the operator guides for Vercel, Supabase, SMTP, migrations, backups, restore drills and incident handling.</p>
              <span className="admin-help-links">
                <a href="/help/install">Installation help</a>
                <a href={`${repositoryUrl}/blob/main/docs/OPERATIONS.md`} target="_blank" rel="noreferrer">Operations guide ↗</a>
              </span>
            </div>
          </article>
        </section>
      </main>
    </AuthenticatedAppShell>
  );
}
