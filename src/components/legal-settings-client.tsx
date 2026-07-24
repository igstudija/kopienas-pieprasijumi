"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { LegalSettings } from "@/lib/legal-settings";
import { useLanguage } from "./language-provider";
import { adminCopy } from "@/lib/admin-i18n";
import { fetchJson, isAbortError, jsonRequest } from "@/lib/client-api";
import { useModalDialog } from "@/lib/use-modal-dialog";

export function LegalSettingsClient() {
  const { locale } = useLanguage();
  const copy = adminCopy[locale];
  const loadError = copy.legalLoadError;
  const [settings, setSettings] = useState<LegalSettings | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const dialogRef = useModalDialog<HTMLElement>(editing, () => setEditing(false), saving);

  const load = useCallback(async (signal?: AbortSignal) => {
    const data = await fetchJson<{ settings: LegalSettings }>("/api/v1/admin/legal", { signal });
    setSettings(data.settings);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchJson<{ settings: LegalSettings }>("/api/v1/admin/legal", { signal: controller.signal })
      .then((data) => setSettings(data.settings))
      .catch((cause: unknown) => {
        if (!isAbortError(cause)) setError(loadError);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [loadError]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    const body = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      await fetchJson("/api/v1/admin/legal", jsonRequest("PATCH", body));
      await load();
      setNotice(copy.legalSaved);
      setEditing(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : copy.legalSaveError);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="data-card legal-settings-card">
      <header className="settings-card-header"><p>{copy.legalIntro}</p><button className="button button-dark button-small" type="button" onClick={() => setEditing(true)} disabled={loading || !settings}>{copy.edit}</button></header>
      {error && !editing && <div className="form-error settings-message">{error}</div>}
      {notice && <div className="form-success settings-message">{notice}</div>}
      {settings && <div className="settings-summary"><div><span>{copy.legalEntity}</span><strong>{settings.legalEntityName || copy.legalNotProvided}</strong></div><div><span>{copy.legalPrivacyContact}</span><strong>{settings.privacyContactEmail || settings.legalEmail || copy.legalNotProvidedMasculine}</strong></div><div><span>{copy.legalRetention}</span><strong>{settings.dataRetentionMonths} {copy.legalMonths}</strong></div><div className="settings-public-links"><Link href="/about">{copy.legalViewImprint}</Link><Link href="/privacy">{copy.legalViewPrivacy}</Link></div></div>}
      {editing && settings && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setEditing(false); }}>
          <section ref={dialogRef} className="modal-card" role="dialog" aria-modal="true" aria-labelledby="legal-settings-title" tabIndex={-1}>
            <header className="modal-header"><div><span className="auth-step">{copy.legalController}</span><h2 id="legal-settings-title">{copy.legalModalTitle}</h2></div><button className="modal-close" type="button" aria-label={copy.close} onClick={() => setEditing(false)} disabled={saving}>×</button></header>
            <p className="modal-intro">{copy.legalModalIntro}</p>
            <form onSubmit={save}>
              <div className="form-grid">
                <div className="form-group full"><label htmlFor="legal-name">{copy.legalName}</label><input className="field" id="legal-name" name="legalEntityName" defaultValue={settings.legalEntityName} /></div>
                <div className="form-group"><label htmlFor="legal-registration">{copy.legalRegistration}</label><input className="field" id="legal-registration" name="legalRegistrationNumber" defaultValue={settings.legalRegistrationNumber} /></div>
                <div className="form-group"><label htmlFor="legal-country">{copy.legalCountry}</label><input className="field" id="legal-country" name="legalCountry" defaultValue={settings.legalCountry} /></div>
                <div className="form-group full"><label htmlFor="legal-address">{copy.legalAddress}</label><input className="field" id="legal-address" name="legalAddress" defaultValue={settings.legalAddress} /></div>
                <div className="form-group"><label htmlFor="legal-email">{copy.legalEmail}</label><input className="field" id="legal-email" name="legalEmail" type="email" defaultValue={settings.legalEmail} /></div>
                <div className="form-group"><label htmlFor="legal-phone">{copy.legalPhone}</label><input className="field" id="legal-phone" name="legalPhone" type="tel" defaultValue={settings.legalPhone} /></div>
                <div className="form-group"><label htmlFor="privacy-email">{copy.legalPrivacyEmail}</label><input className="field" id="privacy-email" name="privacyContactEmail" type="email" defaultValue={settings.privacyContactEmail} /></div>
                <div className="form-group"><label htmlFor="retention-months">{copy.legalRetentionMonths}</label><input className="field" id="retention-months" name="dataRetentionMonths" type="number" min="1" max="120" defaultValue={settings.dataRetentionMonths} required /></div>
              </div>
              {error && <div className="form-error">{error}</div>}
              <div className="modal-actions"><button className="button button-ghost" type="button" onClick={() => setEditing(false)} disabled={saving}>{copy.cancel}</button><button className="button button-accent" disabled={saving}>{saving ? copy.saving : copy.save}</button></div>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}
