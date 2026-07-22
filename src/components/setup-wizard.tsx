"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { fetchJson, jsonRequest } from "@/lib/client-api";

type SetupStatus = {
  databaseConnected: boolean;
  installed: boolean;
  setupPasswordConfigured: boolean;
  databaseProvider: string;
  detectedUrl: string;
  error?: string;
};

type SetupResult = {
  webhookUrl: string;
  webhookVerifyToken: string;
};

const steps = ["System check", "Community", "WhatsApp", "Administrator", "Complete"];

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
    whatsappBusinessNumber: "+371",
    whatsappAppSecret: "",
    firstName: "",
    lastName: "",
    company: "",
    email: "",
    phone: "+371",
    adminPassword: "",
    adminPasswordConfirm: "",
  });

  const canContinue = useMemo(() => {
    if (step === 0) return initialStatus.databaseConnected && initialStatus.setupPasswordConfigured;
    if (step === 1) return form.instanceName.trim().length >= 2;
    if (step === 2) return form.whatsappBusinessNumber.trim().length >= 8 && form.whatsappAppSecret.trim().length >= 8;
    if (step === 3) return form.setupPassword.length >= 12
      && form.adminPassword.length >= 12
      && form.adminPassword === form.adminPasswordConfirm
      && Boolean(form.firstName.trim() && form.lastName.trim() && form.company.trim() && form.phone.trim().length >= 8);
    return true;
  }, [form, initialStatus, step]);

  function update(name: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
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
          whatsappBusinessNumber: form.whatsappBusinessNumber,
          whatsappAppSecret: form.whatsappAppSecret,
          owner: {
            firstName: form.firstName,
            lastName: form.lastName,
            company: form.company,
            email: form.email,
            phone: form.phone,
            password: form.adminPassword,
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

  async function copy(value: string) {
    await navigator.clipboard.writeText(value);
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
            <div className={initialStatus.setupPasswordConfigured ? "ok" : "bad"}><b>{initialStatus.setupPasswordConfigured ? "✓" : "!"}</b><span><strong>Installation secret</strong><small>{initialStatus.setupPasswordConfigured ? "SETUP_SECRET is stored in Vercel" : "Add SETUP_SECRET in Vercel and redeploy"}</small></span></div>
            <div className="ok"><b>✓</b><span><strong>Public URL</strong><small>{initialStatus.detectedUrl}</small></span></div>
          </div>
          {!canContinue && <p className="setup-warning">Fix the issue shown above and reload this page. <Link href="/help/install">Open installation help</Link></p>}
        </>}

        {step === 1 && <>
          <span className="auth-step">2. Community information</span>
          <h2>Name your instance.</h2>
          <p>This name will be visible to members and connected communities.</p>
          <div className="setup-fields">
            <label>Community name<input className="field" value={form.instanceName} onChange={(event) => update("instanceName", event.target.value)} placeholder="Riga Business Community" autoFocus /></label>
            <div className="form-grid"><label>Time zone<select className="field" value={form.timezone} onChange={(event) => update("timezone", event.target.value)}><option value="Europe/Riga">Europe/Riga</option><option value="Europe/Tallinn">Europe/Tallinn</option><option value="Europe/Vilnius">Europe/Vilnius</option></select></label><label>Default language<select className="field" value={form.locale} onChange={(event) => update("locale", event.target.value)}><option value="lv">Latviešu</option><option value="en">English</option><option value="lt">Lietuvių</option><option value="et">Eesti</option></select></label></div>
          </div>
        </>}

        {step === 2 && <>
          <span className="auth-step">3. WhatsApp connection</span>
          <h2>Connect the community number.</h2>
          <p>The number is used in the sign-in link. The Meta App Secret is encrypted before it is stored in this instance’s database.</p>
          <div className="setup-fields">
            <label>WhatsApp Business number<input className="field" value={form.whatsappBusinessNumber} onChange={(event) => update("whatsappBusinessNumber", event.target.value)} placeholder="+37120000000" inputMode="tel" /></label>
            <label>Meta App Secret<input className="field" value={form.whatsappAppSecret} onChange={(event) => update("whatsappAppSecret", event.target.value)} type="password" autoComplete="off" /><small>Meta for Developers → App settings → Basic → App Secret</small></label>
          </div>
          <p className="setup-note">The wizard creates the webhook URL and verification token automatically in the final step.</p>
        </>}

        {step === 3 && <>
          <span className="auth-step">4. First administrator</span>
          <h2>Create the owner account.</h2>
          <p>This user has full permission to manage the instance and add other administrators.</p>
          <div className="setup-fields">
            <div className="form-grid"><label>First name<input className="field" value={form.firstName} onChange={(event) => update("firstName", event.target.value)} /></label><label>Last name<input className="field" value={form.lastName} onChange={(event) => update("lastName", event.target.value)} /></label></div>
            <label>Company<input className="field" value={form.company} onChange={(event) => update("company", event.target.value)} /></label>
            <div className="form-grid"><label>WhatsApp number<input className="field" value={form.phone} onChange={(event) => update("phone", event.target.value)} inputMode="tel" /></label><label>Email (optional)<input className="field" value={form.email} onChange={(event) => update("email", event.target.value)} type="email" /></label></div>
            <div className="form-grid"><label>Admin password<input className="field" value={form.adminPassword} onChange={(event) => update("adminPassword", event.target.value)} type="password" minLength={12} maxLength={200} autoComplete="new-password" /><small>At least 12 characters. Only a password hash is stored.</small></label><label>Repeat admin password<input className="field" value={form.adminPasswordConfirm} onChange={(event) => update("adminPasswordConfirm", event.target.value)} type="password" minLength={12} maxLength={200} autoComplete="new-password" /><small>{form.adminPasswordConfirm && form.adminPassword !== form.adminPasswordConfirm ? "Passwords do not match." : "This password is only used for /admin sign-in."}</small></label></div>
            <label>Installation secret<input className="field" value={form.setupPassword} onChange={(event) => update("setupPassword", event.target.value)} type="password" autoComplete="current-password" /><small>Enter the same 12+ character value selected for SETUP_SECRET during the Vercel deployment.</small></label>
          </div>
        </>}

        {step === 4 && result && <>
          <span className="auth-step">Installation complete</span>
          <h2>Your instance is ready.</h2>
          <p>Paste these two values into the Meta webhook settings and subscribe to the <b>messages</b> field.</p>
          <div className="result-values">
            <label>Callback URL<div><code>{result.webhookUrl}</code><button type="button" onClick={() => copy(result.webhookUrl)}>Copy</button></div></label>
            <label>Verify token<div><code>{result.webhookVerifyToken}</code><button type="button" onClick={() => copy(result.webhookVerifyToken)}>Copy</button></div></label>
          </div>
          <div className="setup-warning">Keep the verify token in a safe place. It can be rotated later in the administration settings.</div>
          <Link className="button button-accent button-wide" href="/admin">Open administration</Link>
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
