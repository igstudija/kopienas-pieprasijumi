"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export function AdminPasswordLogin() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/v1/auth/admin-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          phone: form.get("phone"),
          password: form.get("password"),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Administratora autorizācija neizdevās.");
      window.location.assign("/admin");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Administratora autorizācija neizdevās.");
      setBusy(false);
    }
  }

  return (
    <form className="auth-form admin-auth-form" onSubmit={submit}>
      <label htmlFor="admin-phone">Tālruņa numurs</label>
      <input id="admin-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="+371 2…" required autoFocus />
      <p className="field-help">Izmanto administratora profilā reģistrēto numuru.</p>
      <label htmlFor="admin-password">Parole</label>
      <input id="admin-password" name="password" type="password" autoComplete="current-password" minLength={12} maxLength={200} required />
      {error && <div className="form-error" role="alert">{error}</div>}
      <button className="button button-accent button-wide" disabled={busy}>
        {busy ? "Pārbaudām…" : "Ieiet administrācijā"}
      </button>
      <p className="admin-login-help">Pieprasījumu autori izmanto <Link href="/login">WhatsApp autorizāciju</Link>.</p>
    </form>
  );
}
