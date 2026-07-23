"use client";

import { FormEvent, useEffect, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { fetchJson, isAbortError, jsonRequest } from "@/lib/client-api";
import { emailProviderDefaults, type EmailProvider } from "@/lib/email-config";
import { useLanguage } from "./language-provider";

type Settings = {
  provider: EmailProvider;
  host: string;
  port: number;
  secure: boolean;
  usernameConfigured: boolean;
  passwordConfigured: boolean;
  fromAddress: string;
  fromName: string;
};

const copy = {
  lv: {
    title: "E-pasts un autorizācija", intro: "Magic link e-pasti tiek sūtīti caur šīs instalācijas SMTP kontu.", provider: "Pakalpojums", custom: "Cits SMTP", host: "SMTP serveris", port: "Ports", secure: "Tiešs TLS/SSL savienojums", username: "SMTP lietotājvārds", password: "SMTP parole / atslēga", configured: "Saglabāts — atstāj tukšu, lai nemainītu", fromEmail: "Sūtītāja e-pasts", fromName: "Sūtītāja nosaukums", save: "Saglabāt iestatījumus", saving: "Saglabājam…", saved: "E-pasta iestatījumi saglabāti.", loadError: "E-pasta iestatījumus neizdevās ielādēt.", saveError: "E-pasta iestatījumus neizdevās saglabāt.", testTitle: "Nosūtīt testa e-pastu", testIntro: "Vispirms saglabā iestatījumus, pēc tam pārbaudi reālu piegādi.", testTo: "Saņēmēja e-pasts", test: "Nosūtīt testu", testing: "Sūtām…", tested: "Testa e-pasts nosūtīts.", testError: "Testa e-pastu neizdevās nosūtīt.", helpTitle: "Ātrā konfigurācija", brevoHelp: "Brevo: nokopē SMTP login un SMTP key no Transactional → Settings → SMTP & API.", mailjetHelp: "Mailjet: lietotājvārds ir API Key, parole ir Secret Key.", customHelp: "Custom SMTP: ievadi sava e-pasta pakalpojuma serveri, portu un akreditācijas datus.", openBrevo: "Atvērt Brevo SMTP iestatījumus", openMailjet: "Atvērt Mailjet SMTP iestatījumus",
  },
  en: {
    title: "Email and authentication", intro: "Magic-link emails are sent through this installation's SMTP account.", provider: "Provider", custom: "Custom SMTP", host: "SMTP host", port: "Port", secure: "Direct TLS/SSL connection", username: "SMTP username", password: "SMTP password / key", configured: "Saved — leave blank to keep it", fromEmail: "Sender email", fromName: "Sender name", save: "Save settings", saving: "Saving…", saved: "Email settings were saved.", loadError: "Email settings could not be loaded.", saveError: "Email settings could not be saved.", testTitle: "Send a test email", testIntro: "Save the settings first, then verify real delivery.", testTo: "Recipient email", test: "Send test", testing: "Sending…", tested: "Test email was sent.", testError: "The test email could not be sent.", helpTitle: "Quick configuration", brevoHelp: "Brevo: copy the SMTP login and SMTP key from Transactional → Settings → SMTP & API.", mailjetHelp: "Mailjet: the username is the API Key and the password is the Secret Key.", customHelp: "Custom SMTP: enter your email provider's host, port, and credentials.", openBrevo: "Open Brevo SMTP settings", openMailjet: "Open Mailjet SMTP settings",
  },
  lt: {
    title: "El. paštas ir autentifikavimas", intro: "Magic link laiškai siunčiami per šio diegimo SMTP paskyrą.", provider: "Paslaugos teikėjas", custom: "Kitas SMTP", host: "SMTP serveris", port: "Prievadas", secure: "Tiesioginis TLS/SSL ryšys", username: "SMTP naudotojas", password: "SMTP slaptažodis / raktas", configured: "Išsaugota — palikite tuščią, kad nekeistumėte", fromEmail: "Siuntėjo el. paštas", fromName: "Siuntėjo vardas", save: "Išsaugoti nustatymus", saving: "Saugoma…", saved: "El. pašto nustatymai išsaugoti.", loadError: "Nepavyko įkelti el. pašto nustatymų.", saveError: "Nepavyko išsaugoti el. pašto nustatymų.", testTitle: "Siųsti bandomąjį laišką", testIntro: "Pirmiausia išsaugokite nustatymus, tada patikrinkite pristatymą.", testTo: "Gavėjo el. paštas", test: "Siųsti testą", testing: "Siunčiama…", tested: "Bandomasis laiškas išsiųstas.", testError: "Nepavyko išsiųsti bandomojo laiško.", helpTitle: "Greita konfigūracija", brevoHelp: "Brevo: nukopijuokite SMTP login ir SMTP key iš Transactional → Settings → SMTP & API.", mailjetHelp: "Mailjet: naudotojas yra API Key, o slaptažodis — Secret Key.", customHelp: "Custom SMTP: įveskite savo paslaugos serverį, prievadą ir prisijungimo duomenis.", openBrevo: "Atidaryti Brevo SMTP nustatymus", openMailjet: "Atidaryti Mailjet SMTP nustatymus",
  },
  et: {
    title: "E-post ja autentimine", intro: "Magic link e-kirjad saadetakse selle installatsiooni SMTP-konto kaudu.", provider: "Teenusepakkuja", custom: "Muu SMTP", host: "SMTP-server", port: "Port", secure: "Otsene TLS/SSL-ühendus", username: "SMTP kasutajanimi", password: "SMTP parool / võti", configured: "Salvestatud — muutmata jätmiseks jäta tühjaks", fromEmail: "Saatja e-post", fromName: "Saatja nimi", save: "Salvesta seaded", saving: "Salvestame…", saved: "E-posti seaded salvestati.", loadError: "E-posti seadeid ei saanud laadida.", saveError: "E-posti seadeid ei saanud salvestada.", testTitle: "Saada testkiri", testIntro: "Salvesta esmalt seaded ja kontrolli seejärel tegelikku kohaletoimetamist.", testTo: "Saaja e-post", test: "Saada test", testing: "Saadame…", tested: "Testkiri saadeti.", testError: "Testkirja ei saanud saata.", helpTitle: "Kiirseadistus", brevoHelp: "Brevo: kopeeri SMTP login ja SMTP key jaotisest Transactional → Settings → SMTP & API.", mailjetHelp: "Mailjet: kasutajanimi on API Key ja parool on Secret Key.", customHelp: "Custom SMTP: sisesta oma teenuse server, port ja autentimisandmed.", openBrevo: "Ava Brevo SMTP seaded", openMailjet: "Ava Mailjet SMTP seaded",
  },
} satisfies Record<Locale, Record<string, string>>;

export function EmailAdminClient() {
  const { locale } = useLanguage();
  const messages = copy[locale];
  const [settings, setSettings] = useState<Settings | null>(null);
  const [provider, setProvider] = useState<EmailProvider>("brevo");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetchJson<{ settings: Settings }>("/api/v1/admin/email", { signal: controller.signal })
      .then((data) => {
        setSettings(data.settings);
        setProvider(data.settings.provider);
      })
      .catch((cause: unknown) => {
        if (!isAbortError(cause)) setError(messages.loadError);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [messages.loadError]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    const form = event.currentTarget;
    const data = new FormData(form);
    const preset = emailProviderDefaults[provider];
    try {
      const response = await fetchJson<{ settings: Settings }>("/api/v1/admin/email", jsonRequest("PATCH", {
        provider,
        host: provider === "custom" ? data.get("host") : preset.host,
        port: provider === "custom" ? Number(data.get("port")) : preset.port,
        secure: provider === "custom" ? data.get("secure") === "on" : preset.secure,
        username: data.get("username"),
        password: data.get("password"),
        fromAddress: data.get("fromAddress"),
        fromName: data.get("fromName"),
      }));
      setSettings(response.settings);
      setProvider(response.settings.provider);
      const password = form.elements.namedItem("password") as HTMLInputElement | null;
      const username = form.elements.namedItem("username") as HTMLInputElement | null;
      if (password) password.value = "";
      if (username) username.value = "";
      setNotice(messages.saved);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : messages.saveError);
    } finally {
      setSaving(false);
    }
  }

  async function sendTest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTesting(true);
    setError("");
    setNotice("");
    const form = new FormData(event.currentTarget);
    try {
      await fetchJson("/api/v1/admin/email", jsonRequest("POST", { to: form.get("to") }));
      setNotice(messages.tested);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : messages.testError);
    } finally {
      setTesting(false);
    }
  }

  if (loading) return <div className="loading-state"><div className="skeleton" /></div>;
  if (!settings) return <div className="form-error">{error || messages.loadError}</div>;
  const custom = provider === "custom";
  return (
    <main className="app-main">
      <div className="email-admin-grid">
        <section className="data-card email-settings-card">
          <div className="data-card-heading"><h2>{messages.title}</h2><p>{messages.intro}</p></div>
          <form className="compact-form" onSubmit={save}>
            <label>{messages.provider}<select className="field" value={provider} onChange={(event) => setProvider(event.target.value as EmailProvider)}><option value="brevo">Brevo</option><option value="mailjet">Mailjet</option><option value="custom">{messages.custom}</option></select></label>
            {custom && <div className="form-grid"><label>{messages.host}<input className="field" name="host" defaultValue={settings.provider === "custom" ? settings.host : ""} required /></label><label>{messages.port}<input className="field" name="port" type="number" min="1" max="65535" defaultValue={settings.provider === "custom" ? settings.port : 587} required /></label><label className="checkbox-row full"><input name="secure" type="checkbox" defaultChecked={settings.provider === "custom" && settings.secure} />{messages.secure}</label></div>}
            <label>{messages.username}<input className="field" name="username" autoComplete="off" placeholder={settings.usernameConfigured && provider === settings.provider ? messages.configured : ""} /></label>
            <label>{messages.password}<input className="field" name="password" type="password" autoComplete="new-password" placeholder={settings.passwordConfigured && provider === settings.provider ? messages.configured : ""} /></label>
            <label>{messages.fromEmail}<input className="field" name="fromAddress" type="email" defaultValue={settings.fromAddress} required /></label>
            <label>{messages.fromName}<input className="field" name="fromName" defaultValue={settings.fromName} required /></label>
            <button className="button button-accent" disabled={saving}>{saving ? messages.saving : messages.save}</button>
          </form>
        </section>
        <div className="email-admin-side">
          <section className="data-card email-test-card">
            <div className="data-card-heading"><h2>{messages.testTitle}</h2><p>{messages.testIntro}</p></div>
            <form className="compact-form" onSubmit={sendTest}>
              <label>{messages.testTo}<input className="field" name="to" type="email" defaultValue={settings.fromAddress} required /></label>
              <button className="button button-dark" disabled={testing}>{testing ? messages.testing : messages.test}</button>
            </form>
          </section>
          <section className="data-card email-help-card">
            <div className="data-card-heading"><h2>{messages.helpTitle}</h2></div>
            <p>{provider === "brevo" ? messages.brevoHelp : provider === "mailjet" ? messages.mailjetHelp : messages.customHelp}</p>
            {provider === "brevo" && <a href="https://app.brevo.com/settings/keys/smtp" target="_blank" rel="noreferrer">{messages.openBrevo} ↗</a>}
            {provider === "mailjet" && <a href="https://app.mailjet.com/account/relay" target="_blank" rel="noreferrer">{messages.openMailjet} ↗</a>}
          </section>
        </div>
      </div>
      {error && <div className="form-error">{error}</div>}
      {notice && <div className="form-success">{notice}</div>}
    </main>
  );
}
