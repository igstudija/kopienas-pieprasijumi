"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

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

const steps = ["Pārbaude", "Grupa", "WhatsApp", "Administrators", "Pabeigts"];

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
  });

  const canContinue = useMemo(() => {
    if (step === 0) return initialStatus.databaseConnected && initialStatus.setupPasswordConfigured;
    if (step === 1) return form.instanceName.trim().length >= 2;
    if (step === 2) return form.whatsappBusinessNumber.trim().length >= 8 && form.whatsappAppSecret.trim().length >= 8;
    if (step === 3) return form.setupPassword.length >= 12 && Boolean(form.firstName.trim() && form.lastName.trim() && form.company.trim() && form.phone.trim().length >= 8);
    return true;
  }, [form, initialStatus, step]);

  function update(name: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function finish() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/v1/setup/complete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
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
          },
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Instalāciju neizdevās pabeigt.");
      setResult(data);
      setStep(4);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Instalāciju neizdevās pabeigt.");
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
        <span className="auth-step">Pirmā palaišana</span>
        <h1>Uzstādi savu<br />kopienas sistēmu.</h1>
        <p>Šī instalācija, datubāze un visi dati pieder tikai tavai grupai.</p>
        <ol>{steps.map((label, index) => <li className={index === step ? "current" : index < step ? "done" : ""} key={label}><b>{index < step ? "✓" : index + 1}</b><span>{label}</span></li>)}</ol>
      </aside>

      <section className="setup-card">
        {step === 0 && <>
          <span className="auth-step">1. Sistēmas pārbaude</span>
          <h2>Vai viss ir gatavs?</h2>
          <p>Vednis pārbauda tikai nepieciešamo infrastruktūru. Datubāzes paroles šeit nav jāievada.</p>
          <div className="check-list">
            <div className={initialStatus.databaseConnected ? "ok" : "bad"}><b>{initialStatus.databaseConnected ? "✓" : "!"}</b><span><strong>{initialStatus.databaseProvider} datubāze</strong><small>{initialStatus.databaseConnected ? "Savienojums darbojas" : initialStatus.error}</small></span></div>
            <div className={initialStatus.setupPasswordConfigured ? "ok" : "bad"}><b>{initialStatus.setupPasswordConfigured ? "✓" : "!"}</b><span><strong>Instalācijas parole</strong><small>{initialStatus.setupPasswordConfigured ? "SETUP_SECRET ir saglabāts Vercel" : "Vercel jāpievieno SETUP_SECRET un jāveic redeploy"}</small></span></div>
            <div className="ok"><b>✓</b><span><strong>Publiskā adrese</strong><small>{initialStatus.detectedUrl}</small></span></div>
          </div>
          {!canContinue && <p className="setup-warning">Novērs norādīto problēmu un pārlādē šo lapu. <Link href="/help/install">Atvērt instalēšanas palīdzību</Link></p>}
        </>}

        {step === 1 && <>
          <span className="auth-step">2. Grupas informācija</span>
          <h2>Nosauc savu instanci.</h2>
          <p>Šis nosaukums būs redzams biedriem un citām savienotajām grupām.</p>
          <div className="setup-fields">
            <label>Grupas nosaukums<input className="field" value={form.instanceName} onChange={(event) => update("instanceName", event.target.value)} placeholder="Rīgas uzņēmēju kopiena" autoFocus /></label>
            <div className="form-grid"><label>Laika zona<select className="field" value={form.timezone} onChange={(event) => update("timezone", event.target.value)}><option value="Europe/Riga">Europe/Riga</option><option value="Europe/Tallinn">Europe/Tallinn</option><option value="Europe/Vilnius">Europe/Vilnius</option></select></label><label>Valoda<select className="field" value={form.locale} onChange={(event) => update("locale", event.target.value)}><option value="lv">Latviešu</option><option value="en">English</option></select></label></div>
          </div>
        </>}

        {step === 2 && <>
          <span className="auth-step">3. WhatsApp savienojums</span>
          <h2>Pieslēdz grupas numuru.</h2>
          <p>Numurs veidos autorizācijas saiti. Meta App Secret glabāsies šifrēts tikai tavas instances datubāzē.</p>
          <div className="setup-fields">
            <label>WhatsApp Business numurs<input className="field" value={form.whatsappBusinessNumber} onChange={(event) => update("whatsappBusinessNumber", event.target.value)} placeholder="+37120000000" inputMode="tel" /></label>
            <label>Meta App Secret<input className="field" value={form.whatsappAppSecret} onChange={(event) => update("whatsappAppSecret", event.target.value)} type="password" autoComplete="off" /><small>Meta for Developers → App settings → Basic → App Secret</small></label>
          </div>
          <p className="setup-note">Webhook adresi un verifikācijas tokenu vednis izveidos automātiski pēdējā solī.</p>
        </>}

        {step === 3 && <>
          <span className="auth-step">4. Pirmais administrators</span>
          <h2>Izveido īpašnieku.</h2>
          <p>Šim lietotājam būs pilnas tiesības pārvaldīt instanci un pievienot citus administratorus.</p>
          <div className="setup-fields">
            <div className="form-grid"><label>Vārds<input className="field" value={form.firstName} onChange={(event) => update("firstName", event.target.value)} /></label><label>Uzvārds<input className="field" value={form.lastName} onChange={(event) => update("lastName", event.target.value)} /></label></div>
            <label>Uzņēmums<input className="field" value={form.company} onChange={(event) => update("company", event.target.value)} /></label>
            <div className="form-grid"><label>WhatsApp numurs<input className="field" value={form.phone} onChange={(event) => update("phone", event.target.value)} inputMode="tel" /></label><label>E-pasts (nav obligāts)<input className="field" value={form.email} onChange={(event) => update("email", event.target.value)} type="email" /></label></div>
            <label>Instalācijas parole<input className="field" value={form.setupPassword} onChange={(event) => update("setupPassword", event.target.value)} type="password" autoComplete="current-password" /><small>Tā pati vismaz 12 rakstzīmju parole, kuru izvēlējies Vercel instalēšanas laikā.</small></label>
          </div>
        </>}

        {step === 4 && result && <>
          <span className="auth-step">Instalācija pabeigta</span>
          <h2>Instance ir gatava.</h2>
          <p>Tagad Meta webhook iestatījumos ievadi šīs divas vērtības un abonē <b>messages</b> notikumus.</p>
          <div className="result-values">
            <label>Callback URL<div><code>{result.webhookUrl}</code><button type="button" onClick={() => copy(result.webhookUrl)}>Kopēt</button></div></label>
            <label>Verify token<div><code>{result.webhookVerifyToken}</code><button type="button" onClick={() => copy(result.webhookVerifyToken)}>Kopēt</button></div></label>
          </div>
          <div className="setup-warning">Saglabā verify tokenu drošā vietā. To varēs mainīt vēlāk administrācijas iestatījumos.</div>
          <Link className="button button-accent button-wide" href="/login">Atvērt WhatsApp autorizāciju</Link>
        </>}

        {error && <div className="form-error">{error}</div>}
        {step < 4 && <footer className="setup-actions">
          {step > 0 ? <button className="button button-ghost" type="button" onClick={() => { setError(""); setStep((value) => value - 1); }}>Atpakaļ</button> : <Link className="button button-ghost" href="/help/install">Palīdzība</Link>}
          {step < 3 ? <button className="button button-dark" type="button" disabled={!canContinue} onClick={() => { setError(""); setStep((value) => value + 1); }}>Turpināt</button> : <button className="button button-accent" type="button" disabled={!canContinue || busy} onClick={finish}>{busy ? "Uzstādām…" : "Pabeigt instalāciju"}</button>}
        </footer>}
      </section>
    </div>
  );
}
