"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLanguage } from "./language-provider";

const STORAGE_KEY = "community_cookie_consent_v1";

export function CookieNotice() {
  const { messages } = useLanguage();
  const [visible, setVisible] = useState(false);
  const [details, setDetails] = useState(false);
  const [preferences, setPreferences] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (!saved) setVisible(true);
      else {
        try { setPreferences(Boolean(JSON.parse(saved).preferences)); } catch { setVisible(true); }
      }
    }, 0);
    function openSettings() { setDetails(true); setVisible(true); }
    window.addEventListener("community:open-cookie-settings", openSettings);
    return () => { window.clearTimeout(timer); window.removeEventListener("community:open-cookie-settings", openSettings); };
  }, []);

  function save(preferenceValue: boolean) {
    setPreferences(preferenceValue);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ necessary: true, preferences: preferenceValue, analytics: false, version: 1, savedAt: new Date().toISOString() }));
    if (!preferenceValue) document.cookie = "community_locale=; Path=/; Max-Age=0; SameSite=Lax";
    setVisible(false);
    setDetails(false);
  }

  if (!visible) return null;
  return (
    <aside className={`cookie-notice ${details ? "cookie-details" : ""}`} role="region" aria-labelledby="cookie-title">
      <div className="cookie-copy"><strong id="cookie-title">{messages.cookieTitle}</strong><p>{messages.cookieText}</p><Link href="/privacy">{messages.cookieMore}</Link></div>
      {details && <div className="cookie-categories">
        <div><span><b>{messages.cookieNecessary}</b><small>{messages.cookieNecessaryText}</small></span><em>{messages.cookieAlwaysOn}</em></div>
        <label><span><b>{messages.cookiePreferences}</b><small>{messages.cookiePreferencesText}</small></span><input type="checkbox" checked={preferences} onChange={(event) => setPreferences(event.target.checked)} /></label>
        <div><span><b>{messages.cookieAnalytics}</b><small>{messages.cookieAnalyticsText}</small></span><em>{messages.cookieNotUsed}</em></div>
      </div>}
      <div className="cookie-actions">
        {!details && <button className="button button-ghost button-small" type="button" onClick={() => setDetails(true)}>{messages.cookieSettings}</button>}
        <button className="button button-ghost button-small" type="button" onClick={() => save(false)}>{messages.cookieReject}</button>
        <button className="button button-accent button-small" type="button" onClick={() => save(details ? preferences : true)}>{details ? messages.cookieSave : messages.cookieAccept}</button>
      </div>
    </aside>
  );
}
