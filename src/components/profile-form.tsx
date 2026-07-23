"use client";

import { FormEvent, useEffect, useState } from "react";
import { fetchJson, isAbortError, jsonRequest } from "@/lib/client-api";
import { useLanguage } from "./language-provider";

type Profile = {
  firstName: string;
  lastName: string;
  displayName: string;
  company: string;
  category: string | null;
  email: string;
  phone: string;
  role: "owner" | "admin" | "member";
};

export function ProfileForm() {
  const { messages } = useLanguage();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetchJson<{ profile: Profile }>("/api/v1/profile", { signal: controller.signal })
      .then((data) => {
        setProfile(data.profile);
      })
      .catch((cause: unknown) => {
        if (!isAbortError(cause)) setError(cause instanceof Error ? cause.message : "Profilu neizdevās ielādēt.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    const body = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      await fetchJson("/api/v1/profile", jsonRequest("PATCH", body));
      setNotice(messages.profileSaved);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Profilu neizdevās saglabāt.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="loading-state"><div className="skeleton" /></div>;
  if (!profile) return <div className="form-error">{error || "Profilu neizdevās ielādēt."}</div>;
  return (
    <form className="form-card profile-form" onSubmit={save}>
      <div className="form-grid">
        <div className="form-group"><label htmlFor="profile-first-name">{messages.firstName}</label><input className="field" id="profile-first-name" name="firstName" defaultValue={profile.firstName} required /></div>
        <div className="form-group"><label htmlFor="profile-last-name">{messages.lastName}</label><input className="field" id="profile-last-name" name="lastName" defaultValue={profile.lastName} required /></div>
        <div className="form-group"><label htmlFor="profile-company">{messages.company}</label><input className="field" id="profile-company" name="company" defaultValue={profile.company} required /></div>
        <div className="form-group"><label htmlFor="profile-category">{messages.category}</label><input className="field" id="profile-category" name="category" defaultValue={profile.category ?? ""} /></div>
        <div className="form-group"><label htmlFor="profile-email">{messages.email}</label><input className="field" id="profile-email" name="email" type="email" defaultValue={profile.email} required /></div>
        <div className="form-group"><label htmlFor="profile-phone">{messages.phone}</label><input className="field" id="profile-phone" name="phone" type="tel" inputMode="tel" defaultValue={profile.phone} required /><small>{messages.phoneHelp}</small></div>
      </div>
      {error && <div className="form-error">{error}</div>}
      {notice && <div className="form-success">{notice}</div>}
      <div className="form-actions"><button className="button button-accent" disabled={saving}>{saving ? messages.saving : messages.saveProfile}</button></div>
    </form>
  );
}
