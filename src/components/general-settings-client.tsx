"use client";

import { FormEvent, useEffect, useState } from "react";
import { fetchJson, isAbortError, jsonRequest } from "@/lib/client-api";
import type { Locale } from "@/lib/i18n";
import { useLanguage } from "./language-provider";

type Settings = { locale: Locale };

const copy = {
  lv: {
    title: "Instalācijas valoda",
    intro: "Šī ir viena kopīga valoda visai instalācijai — autorizācijai, biedru videi, administrācijai un sistēmas e-pastiem.",
    label: "Sistēmas valoda",
    help: "Izmaiņa attiecas uz visiem lietotājiem. Pēc saglabāšanas lapa tiks pārlādēta izvēlētajā valodā.",
    save: "Saglabāt valodu",
    saving: "Saglabājam…",
    loadError: "Iestatījumus neizdevās ielādēt.",
    saveError: "Valodu neizdevās saglabāt.",
  },
  en: {
    title: "Installation language",
    intro: "This is the single shared language for the entire installation: sign-in, member area, administration and system emails.",
    label: "System language",
    help: "The change applies to every user. After saving, the page reloads in the selected language.",
    save: "Save language",
    saving: "Saving…",
    loadError: "Settings could not be loaded.",
    saveError: "The language could not be saved.",
  },
  lt: {
    title: "Diegimo kalba",
    intro: "Tai viena bendra viso diegimo kalba: prisijungimui, narių aplinkai, administravimui ir sistemos laiškams.",
    label: "Sistemos kalba",
    help: "Pakeitimas taikomas visiems naudotojams. Išsaugojus puslapis bus įkeltas pasirinkta kalba.",
    save: "Išsaugoti kalbą",
    saving: "Saugoma…",
    loadError: "Nustatymų nepavyko įkelti.",
    saveError: "Kalbos nepavyko išsaugoti.",
  },
  et: {
    title: "Installatsiooni keel",
    intro: "See on kogu installatsiooni ühine keel: sisselogimine, liikmevaade, haldus ja süsteemi e-kirjad.",
    label: "Süsteemi keel",
    help: "Muudatus kehtib kõigile kasutajatele. Pärast salvestamist laaditakse leht valitud keeles uuesti.",
    save: "Salvesta keel",
    saving: "Salvestamine…",
    loadError: "Seadeid ei saanud laadida.",
    saveError: "Keelt ei saanud salvestada.",
  },
} satisfies Record<Locale, Record<string, string>>;

const languageNames: Record<Locale, string> = {
  lv: "Latviešu",
  en: "English",
  lt: "Lietuvių",
  et: "Eesti",
};

export function GeneralSettingsClient() {
  const { locale } = useLanguage();
  const messages = copy[locale];
  const [settings, setSettings] = useState<Settings | null>(null);
  const [selectedLocale, setSelectedLocale] = useState<Locale>(locale);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetchJson<{ settings: Settings }>("/api/v1/admin/settings", { signal: controller.signal })
      .then((data) => {
        setSettings(data.settings);
        setSelectedLocale(data.settings.locale);
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
    try {
      await fetchJson("/api/v1/admin/settings", jsonRequest("PATCH", { locale: selectedLocale }));
      window.location.reload();
    } catch {
      setError(messages.saveError);
      setSaving(false);
    }
  }

  if (loading) return <div className="loading-state"><div className="skeleton" /></div>;
  if (!settings) return <div className="form-error">{error || messages.loadError}</div>;

  return (
    <section className="data-card general-settings-card">
      <div className="data-card-heading"><h2>{messages.title}</h2><p>{messages.intro}</p></div>
      <form className="compact-form" onSubmit={save}>
        <label htmlFor="instance-locale">{messages.label}</label>
        <select className="field" id="instance-locale" value={selectedLocale} onChange={(event) => setSelectedLocale(event.target.value as Locale)}>
          {(Object.keys(languageNames) as Locale[]).map((item) => <option value={item} key={item}>{languageNames[item]}</option>)}
        </select>
        <small>{messages.help}</small>
        {error && <div className="form-error">{error}</div>}
        <button className="button button-accent" disabled={saving || selectedLocale === settings.locale}>{saving ? messages.saving : messages.save}</button>
      </form>
    </section>
  );
}
