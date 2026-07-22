"use client";

import { useEffect, useState } from "react";

type Settings = {
  businessNumber: string;
  appSecretConfigured: boolean;
  webhookUrl: string;
  verifyToken: string;
  privacyUrl: string;
  deletionUrl: string;
};

export function WhatsappAdminClient() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/v1/admin/whatsapp")
      .then(async (response) => ({ response, data: await response.json() }))
      .then(({ response, data }) => { if (!active) return; if (!response.ok) setError(data.error ?? "Settings could not be loaded."); else setSettings(data.settings); })
      .catch(() => { if (active) setError("Settings could not be loaded."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function save(form: HTMLFormElement, regenerateVerifyToken = false) {
    setSaving(true);
    setError("");
    setNotice("");
    const body = { ...Object.fromEntries(new FormData(form).entries()), regenerateVerifyToken };
    try {
      const response = await fetch("/api/v1/admin/whatsapp", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Settings could not be saved.");
      setSettings(data.settings);
      setNotice(regenerateVerifyToken ? "A new verify token has been generated. Update it in Meta now." : "WhatsApp settings have been saved.");
      const appSecret = form.elements.namedItem("appSecret") as HTMLInputElement | null;
      if (appSecret) appSecret.value = "";
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Settings could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="loading-state"><div className="skeleton" /></div>;
  if (!settings) return <div className="form-error">{error || "Settings could not be loaded."}</div>;
  const configurationComplete = Boolean(settings.businessNumber && settings.appSecretConfigured);
  return (
    <div className="whatsapp-admin-grid">
      <section className="data-card whatsapp-settings-card">
        <h2>Connection settings</h2>
        <form className="compact-form" onSubmit={(event) => { event.preventDefault(); save(event.currentTarget); }}>
          <div className={`integration-status ${configurationComplete ? "ready" : "pending"}`}><span aria-hidden="true">{configurationComplete ? "✓" : "!"}</span><div><strong>{configurationComplete ? "Credentials saved" : "Setup incomplete"}</strong><small>{configurationComplete ? "Verify the callback URL and token in Meta, then test a real sign-in." : "Add the business number and Meta App Secret to continue."}</small></div></div>
          <label>WhatsApp business number<input className="field" name="businessNumber" type="tel" inputMode="tel" defaultValue={settings.businessNumber} required /><small>Use international E.164 format, for example +3712…</small></label>
          <label>Meta App Secret<input className="field" name="appSecret" type="password" autoComplete="new-password" placeholder={settings.appSecretConfigured ? "Configured — leave blank to keep it" : "Paste the App Secret"} /><small>Stored encrypted. It is never shown again.</small></label>
          <CopyField label="Webhook callback URL" value={settings.webhookUrl} />
          <CopyField label="Webhook verify token" value={settings.verifyToken} secret />
          {error && <div className="form-error">{error}</div>}
          {notice && <div className="form-success">{notice}</div>}
          <div className="form-actions whatsapp-form-actions"><button className="button button-accent" disabled={saving}>{saving ? "Saving…" : "Save settings"}</button><button className="button button-ghost" type="button" disabled={saving} onClick={(event) => { if (!window.confirm("Generate a new verify token? The Meta webhook will stop verifying until you paste the new token there.")) return; const form = event.currentTarget.form; if (form) save(form, true); }}>Regenerate verify token</button></div>
        </form>
      </section>
      <section className="data-card whatsapp-guide">
        <h2>Meta setup — step by step</h2>
        <ol>
          <GuideStep number="1" title="Create or open a Meta app"><p>Open Meta for Developers, create a Business app, or choose the app dedicated to this installation.</p><a href="https://developers.facebook.com/apps/" target="_blank" rel="noreferrer">Open Meta apps ↗</a></GuideStep>
          <GuideStep number="2" title="Add the WhatsApp product"><p>In the app dashboard, add WhatsApp. In WhatsApp → API Setup, connect the business account and the phone number that members will message.</p><a href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started/" target="_blank" rel="noreferrer">Cloud API getting started ↗</a></GuideStep>
          <GuideStep number="3" title="Copy the App Secret"><p>Go to App settings → Basic, reveal App Secret, and paste it into the field on the left. Do not paste an access token here.</p></GuideStep>
          <GuideStep number="4" title="Configure the webhook"><p>In WhatsApp → Configuration, paste the Callback URL and Verify Token shown on the left. Complete verification and subscribe the WhatsApp Business Account to the <b>messages</b> webhook field.</p><a href="https://developers.facebook.com/docs/whatsapp/cloud-api/guides/set-up-webhooks/" target="_blank" rel="noreferrer">Webhook guide ↗</a></GuideStep>
          <GuideStep number="5" title="Complete the public app information"><p>Use these public URLs in Meta where requested.</p><CopyField label="Privacy Policy URL" value={settings.privacyUrl} /><CopyField label="User Data Deletion URL" value={settings.deletionUrl} /></GuideStep>
          <GuideStep number="6" title="Test the real login"><p>Open the portal on a phone, tap “Log in with WhatsApp”, send the pre-filled message, and confirm that the registered member is returned to the request list.</p></GuideStep>
        </ol>
        <div className="setup-warning">Never place the Meta App Secret, permanent access token or database credentials in GitHub. This application only needs the App Secret for webhook signature verification; it does not need a permanent access token for the current login flow.</div>
      </section>
    </div>
  );
}

function CopyField({ label, value, secret = false }: { label: string; value: string; secret?: boolean }) {
  const [revealed, setRevealed] = useState(!secret);
  return <div className="copy-field"><label>{label}</label><div><code>{revealed ? value : "••••••••••••••••••••••••"}</code>{secret && <button type="button" onClick={() => setRevealed((current) => !current)}>{revealed ? "Hide" : "Show"}</button>}<button type="button" onClick={() => navigator.clipboard.writeText(value)}>Copy</button></div></div>;
}

function GuideStep({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return <li><span>{number}</span><div><h3>{title}</h3>{children}</div></li>;
}
