"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useLanguage } from "./language-provider";
import { adminCopy } from "@/lib/admin-i18n";
import { fetchJson, jsonRequest } from "@/lib/client-api";

export function AdminPasswordLogin() {
  const { locale } = useLanguage();
  const copy = adminCopy[locale];
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      await fetchJson("/api/v1/auth/admin-password", jsonRequest("POST", {
          phone: form.get("phone"),
          password: form.get("password"),
      }));
      window.location.assign("/admin");
    } catch {
      setError(copy.authError);
      setBusy(false);
    }
  }

  return (
    <form className="auth-form admin-auth-form" onSubmit={submit}>
      <label htmlFor="admin-phone">{copy.authPhone}</label>
      <input id="admin-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="+371 2…" required autoFocus />
      <p className="field-help">{copy.authPhoneHelp}</p>
      <label htmlFor="admin-password">{copy.authPassword}</label>
      <input id="admin-password" name="password" type="password" autoComplete="current-password" minLength={12} maxLength={200} required />
      {error && <div className="form-error" role="alert">{error}</div>}
      <button className="button button-accent button-wide" disabled={busy}>
        {busy ? copy.authChecking : copy.authSubmit}
      </button>
      <p className="admin-login-help"><Link href="/">{copy.authMemberHelp}</Link></p>
    </form>
  );
}
