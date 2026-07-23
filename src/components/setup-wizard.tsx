"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { fetchJson, jsonRequest } from "@/lib/client-api";
import { PhoneInput } from "@/components/phone-input";
import { phoneCountryFromLocale } from "@/lib/phone-number";

type SetupStatus = {
  databaseConnected: boolean;
  installed: boolean;
  setupPasswordConfigured: boolean;
  databaseProvider: string;
  detectedUrl: string;
  error?: string;
};

type SetupResult = { instanceId: string; ownerId: string };
type Provider = "brevo" | "mailjet" | "custom";

const steps = ["System check", "Community", "Email delivery", "Administrator", "Complete"];
const presets: Record<Exclude<Provider, "custom">, { host: string; port: number }> = {
  brevo: { host: "smtp-relay.brevo.com", port: 587 },
  mailjet: { host: "in-v3.mailjet.com", port: 587 },
};

export function SetupWizard({ initialStatus }: { initialStatus: SetupStatus }) {
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(initialStatus.error ?? "");
  const [result, setResult] = useState<SetupResult | null>(null);
  const [form, setForm] = useState({
    setupPassword: "",
    instanceName: "",
    timezone: "Europe/Riga",
    locale: "lv",
    provider: "brevo" as Provider,
    smtpHost: presets.brevo.host,
    smtpPort: String(presets.brevo.port),
    smtpSecure: false,
    smtpUsername: "",
    smtpPassword: "",
    fromAddress: "",
    fromName: "",
    firstName: "",
    lastName: "",
    company: "",
    email: "",
    phone: "",
  });

  const canContinue = useMemo(() => {
    if (step === 0) return initialStatus.databaseConnected && initialStatus.setupPasswordConfigured;
    if (step === 1) return form.instanceName.trim().length >= 2;
    if (step === 2) {
      const customReady = form.provider !== "custom" || (form.smtpHost.trim().length > 2 && Number(form.smtpPort) > 0);
      return customReady && Boolean(form.smtpUsername.trim() && form.smtpPassword && form.fromAddress.trim() && form.fromName.trim());
    }
    if (step === 3) {
      return form.setupPassword.length >= 12
        && Boolean(form.firstName.trim() && form.lastName.trim() && form.company.trim() && form.email.trim() && form.phone.trim().length >= 8);
    }
    return true;
  }, [form, initialStatus, step]);

  function update<Key extends keyof typeof form>(name: Key, value: (typeof form)[Key]) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function selectProvider(provider: Provider) {
    if (provider === "custom") {
      setForm((current) => ({ ...current, provider }));
      return;
    }
    setForm((current) => ({
      ...current,
      provider,
      smtpHost: presets[provider].host,
      smtpPort: String(presets[provider].port),
      smtpSecure: false,
    }));
  }

  async function finish() {
    setBusy(true);
    setError("");
    try {
      const data = await fetchJson<SetupResult>("/api/v1/setup/complete", jsonRequest("POST", {
        setupPassword: form.setupPassword,
        instanceName: form.instanceName,
        timezone: form.timezone,
        locale: form.locale,
        email: {
          provider: form.provider,
          host: form.smtpHost,
          port: Number(form.smtpPort),
          secure: form.smtpSecure,
          username: form.smtpUsername,
          password: form.smtpPassword,
          fromAddress: form.fromAddress,
          fromName: form.fromName,
        },
        owner: {
          firstName: form.firstName,
          lastName: form.lastName,
          company: form.company,
          email: form.email,
          phone: form.phone,
        },
      }));
      setResult(data);
      setStep(4);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The installation could not be completed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="setup-layout">
      <aside className="setup-progress">
        <span className="auth-step">First run</span>
        <h1>Set up your<br />community system.</h1>
        <p>This installation, its database and all its data belong only to your community.</p>
        <ol>{steps.map((label, index) => <li className={index === step ? "current" : index < step ? "done" : ""} key={label}><b>{index < step ? "✓" : index + 1}</b><span>{label}</span></li>)}</ol>
      </aside>

      <section className="setup-card">
        {step === 0 && <>
          <span className="auth-step">1. System check</span>
          <h2>Is everything ready?</h2>
          <p>The wizard checks only the required infrastructure. Database credentials are never entered here.</p>
          <div className="check-list">
            <div className={initialStatus.databaseConnected ? "ok" : "bad"}><b>{initialStatus.databaseConnected ? "✓" : "!"}</b><span><strong>{initialStatus.databaseProvider} database</strong><small>{initialStatus.databaseConnected ? "Connection works" : initialStatus.error}</small></span></div>
            <div className={initialStatus.setupPasswordConfigured ? "ok" : "bad"}><b>{initialStatus.setupPasswordConfigured ? "✓" : "!"}</b><span><strong>Installation secret</strong><small>{initialStatus.setupPasswordConfigured ? "SETUP_SECRET is configured" : "Add SETUP_SECRET and redeploy"}</small></span></div>
            <div className="ok"><b>✓</b><span><strong>Public URL</strong><small>{initialStatus.detectedUrl}</small></span></div>
          </div>
          {!canContinue && <p className="setup-warning">Fix the issue shown above and reload this page. <Link href="/help/install">Open installation help</Link></p>}
        </>}

        {step === 1 && <>
          <span className="auth-step">2. Community information</span>
          <h2>Name your instance.</h2>
          <p>This name is visible to members and connected communities.</p>
          <div className="setup-fields">
            <label>Community name<input className="field" value={form.instanceName} onChange={(event) => update("instanceName", event.target.value)} placeholder="Riga Business Community" autoFocus /></label>
            <div className="form-grid"><label>Time zone<select className="field" value={form.timezone} onChange={(event) => update("timezone", event.target.value)}><option value="Europe/Riga">Europe/Riga</option><option value="Europe/Tallinn">Europe/Tallinn</option><option value="Europe/Vilnius">Europe/Vilnius</option></select></label><label>Default language<select className="field" value={form.locale} onChange={(event) => update("locale", event.target.value)}><option value="lv">Latviešu</option><option value="en">English</option><option value="lt">Lietuvių</option><option value="et">Eesti</option></select></label></div>
          </div>
        </>}

        {step === 2 && <>
          <span className="auth-step">3. Email delivery</span>
          <h2>Connect an SMTP provider.</h2>
          <p>Magic sign-in links are sent through your own Brevo, Mailjet or SMTP account. Credentials are encrypted before storage.</p>
          <div className="setup-fields">
            <label>Provider<select className="field" value={form.provider} onChange={(event) => selectProvider(event.target.value as Provider)}><option value="brevo">Brevo</option><option value="mailjet">Mailjet</option><option value="custom">Custom SMTP</option></select></label>
            {form.provider === "custom" && <div className="form-grid"><label>SMTP host<input className="field" value={form.smtpHost} onChange={(event) => update("smtpHost", event.target.value)} /></label><label>SMTP port<input className="field" type="number" min="1" max="65535" value={form.smtpPort} onChange={(event) => update("smtpPort", event.target.value)} /></label></div>}
            {form.provider === "custom" && <label className="checkbox-row"><input type="checkbox" checked={form.smtpSecure} onChange={(event) => update("smtpSecure", event.target.checked)} /> Use implicit TLS (usually port 465)</label>}
            <div className="form-grid"><label>SMTP username<input className="field" value={form.smtpUsername} onChange={(event) => update("smtpUsername", event.target.value)} autoComplete="off" /></label><label>SMTP password / API key<input className="field" value={form.smtpPassword} onChange={(event) => update("smtpPassword", event.target.value)} type="password" autoComplete="new-password" /></label></div>
            <div className="form-grid"><label>Sender email<input className="field" value={form.fromAddress} onChange={(event) => update("fromAddress", event.target.value)} type="email" /></label><label>Sender name<input className="field" value={form.fromName} onChange={(event) => update("fromName", event.target.value)} /></label></div>
          </div>
          <p className="setup-note">The wizard sends a test email to the first administrator before saving the installation.</p>
        </>}

        {step === 3 && <>
          <span className="auth-step">4. First administrator</span>
          <h2>Create the owner account.</h2>
          <p>The owner signs in with the same email magic link as every other member.</p>
          <div className="setup-fields">
            <div className="form-grid"><label>First name<input className="field" value={form.firstName} onChange={(event) => update("firstName", event.target.value)} /></label><label>Last name<input className="field" value={form.lastName} onChange={(event) => update("lastName", event.target.value)} /></label></div>
            <label>Company<input className="field" value={form.company} onChange={(event) => update("company", event.target.value)} /></label>
            <div className="form-grid"><label>Contact phone<PhoneInput id="setup-owner-phone" name="phone" locale="en" countryLabel="Country and calling code" defaultCountry={phoneCountryFromLocale(form.locale as "lv" | "en" | "lt" | "et")} defaultValue={form.phone} onChange={(phone) => update("phone", phone)} required /></label><label>Sign-in email<input className="field" value={form.email} onChange={(event) => update("email", event.target.value)} type="email" /></label></div>
            <label>Installation secret<input className="field" value={form.setupPassword} onChange={(event) => update("setupPassword", event.target.value)} type="password" autoComplete="current-password" /><small>Enter the same 12+ character value selected for SETUP_SECRET during deployment.</small></label>
          </div>
        </>}

        {step === 4 && result && <>
          <span className="auth-step">Installation complete</span>
          <h2>Your instance is ready.</h2>
          <p>The SMTP connection was verified and the owner test email was sent. Open the system and request your first sign-in link.</p>
          <Link className="button button-accent button-wide" href="/">Open the system</Link>
        </>}

        {error && <div className="form-error">{error}</div>}
        {step < 4 && <footer className="setup-actions">
          {step > 0 ? <button className="button button-ghost" type="button" onClick={() => { setError(""); setStep((value) => value - 1); }}>Back</button> : <Link className="button button-ghost" href="/help/install">Help</Link>}
          {step < 3 ? <button className="button button-dark" type="button" disabled={!canContinue} onClick={() => { setError(""); setStep((value) => value + 1); }}>Continue</button> : <button className="button button-accent" type="button" disabled={!canContinue || busy} onClick={finish}>{busy ? "Installing…" : "Complete installation"}</button>}
        </footer>}
      </section>
    </div>
  );
}
