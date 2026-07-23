"use client";

import { FormEvent, useEffect, useState } from "react";
import { fetchJson, jsonRequest } from "@/lib/client-api";
import { useLanguage } from "./language-provider";

export function EmailLoginForm() {
  const { locale, messages } = useLanguage();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = new URLSearchParams(window.location.hash.slice(1)).get("login_token");
    if (!token) return;
    queueMicrotask(() => {
      setConfirming(true);
      setError("");
    });
    fetchJson("/api/v1/auth/email/confirm", jsonRequest("POST", { token }))
      .then(() => {
        window.history.replaceState(null, "", "/");
        window.location.reload();
      })
      .catch(() => {
        window.history.replaceState(null, "", "/");
        setError(messages.confirmInvalid);
        setConfirming(false);
      });
  }, [messages.confirmInvalid]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await fetchJson("/api/v1/auth/email/start", jsonRequest("POST", { email, locale }));
      setSent(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : messages.confirmInvalid);
    } finally {
      setBusy(false);
    }
  }

  if (confirming) {
    return (
      <div className="email-login-success" role="status" aria-live="polite">
        <span aria-hidden="true">…</span>
        <h2>{messages.confirmTitle}</h2>
        <p>{messages.confirming}</p>
      </div>
    );
  }

  if (sent) {
    return (
      <div className="email-login-success" role="status">
        <span aria-hidden="true">✓</span>
        <h2>{messages.loginSentTitle}</h2>
        <p>{messages.loginSentText}</p>
        <button className="button button-ghost" type="button" onClick={() => { setSent(false); setError(""); }}>
          {messages.loginTryAgain}
        </button>
      </div>
    );
  }

  return (
    <form className="email-login-form" onSubmit={submit}>
      <label htmlFor="login-email">{messages.loginEmail}</label>
      <input
        className="field"
        id="login-email"
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder={messages.loginEmailPlaceholder}
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        maxLength={320}
        required
        autoFocus
      />
      {error && <div className="form-error" role="alert">{error}</div>}
      <button className="button button-accent button-wide" disabled={busy}>
        {busy ? messages.loginSending : messages.loginSend}
      </button>
    </form>
  );
}
