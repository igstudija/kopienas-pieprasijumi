"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
type Peer = { id: string; name: string; baseUrl: string; status: string; protocolVersion: number };
export function FederationClient() {
  const [peers, setPeers] = useState<Peer[]>([]); const [pairingCode, setPairingCode] = useState(""); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  async function load() { const response = await fetch("/api/v1/admin/federation/peers"); const data = await response.json(); if (response.ok) setPeers(data.peers); }
  useEffect(() => {
    let active = true;
    fetch("/api/v1/admin/federation/peers")
      .then(async (response) => ({ response, data: await response.json() }))
      .then(({ response, data }) => { if (active && response.ok) setPeers(data.peers); })
      .catch(() => { if (active) setError("Savienojumus neizdevās ielādēt."); });
    return () => { active = false; };
  }, []);
  async function invite() { setLoading(true); setError(""); const response = await fetch("/api/v1/admin/federation/invites", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ label: "Jauna kopiena" }) }); const data = await response.json(); if (response.ok) setPairingCode(data.pairingCode); else setError(data.error); setLoading(false); }
  async function connect(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setLoading(true); setError(""); const form = new FormData(event.currentTarget); const response = await fetch("/api/v1/admin/federation/peers", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ pairingCode: form.get("code") }) }); const data = await response.json(); if (response.ok) { event.currentTarget.reset(); await load(); } else setError(data.error); setLoading(false); }
  return <main className="app-main"><header className="app-heading"><div><span className="auth-step">Droša federācija</span><h1>Savienotās<br />kopienas.</h1></div><Link className="button button-ghost" href="/admin">Atpakaļ pie biedriem</Link></header>{error && <div className="form-error">{error}</div>}<div className="admin-grid"><section className="data-card"><h2>Uzticamie savienojumi</h2>{peers.length ? peers.map((peer) => <div className="peer-row" key={peer.id}><div><strong>{peer.name}</strong><small>{peer.baseUrl}</small></div><div><small>Protokols v{peer.protocolVersion}</small></div><span className={`status-pill ${peer.status}`}>{peer.status}</span></div>) : <div className="compact-form"><p className="field-help">Vēl nav savienotu kopienu.</p></div>}</section><div style={{display:"grid", gap:24}}><section className="data-card"><h2>Uzaicināt kopienu</h2><div className="compact-form"><p className="field-help">Kods ir derīgs 24 stundas un izmantojams vienu reizi.</p><button className="button button-accent" onClick={invite} disabled={loading}>Izveidot savienošanas kodu</button>{pairingCode && <div className="pairing-code">{pairingCode}</div>}</div></section><section className="data-card"><h2>Pievienoties kopienai</h2><form className="compact-form" onSubmit={connect}><textarea className="field" name="code" placeholder="Ielīmē otras instances savienošanas kodu" required/><button className="button button-dark" disabled={loading}>Savienot instances</button></form></section></div></div></main>;
}
