"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

type Peer = {
  id: string;
  name: string;
  baseUrl: string;
  status: string;
  protocolVersion: number;
  allowIncoming: boolean;
  allowOutgoing: boolean;
};

export function FederationClient() {
  const [peers, setPeers] = useState<Peer[]>([]);
  const [pairingCode, setPairingCode] = useState("");
  const [remoteName, setRemoteName] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function load() {
    const response = await fetch("/api/v1/admin/federation/peers");
    const data = await response.json();
    if (response.ok) setPeers(data.peers);
    else setError(data.error ?? "Savienojumus neizdevās ielādēt.");
  }

  useEffect(() => {
    let active = true;
    async function refresh() {
      try {
        const response = await fetch("/api/v1/admin/federation/peers");
        const data = await response.json();
        if (!active) return;
        if (response.ok) setPeers(data.peers);
        else setError(data.error ?? "Savienojumus neizdevās ielādēt.");
      } catch {
        if (active) setError("Savienojumus neizdevās ielādēt.");
      }
    }
    void refresh();
    const interval = setInterval(refresh, 5000);
    return () => { active = false; clearInterval(interval); };
  }, []);

  async function createCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");
    setCopied(false);
    try {
      const response = await fetch("/api/v1/admin/federation/invites", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ label: remoteName }),
      });
      const data = await response.json();
      if (response.ok) {
        setPairingCode(data.pairingCode);
        setNotice("Mūsu kods ir gatavs. Nosūti to otras grupas administratoram.");
      } else {
        setError(data.error ?? "Kodu neizdevās izveidot.");
      }
    } catch {
      setError("Kodu neizdevās izveidot.");
    } finally {
      setLoading(false);
    }
  }

  async function connect(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");
    const form = event.currentTarget;
    const formData = new FormData(form);
    try {
      const response = await fetch("/api/v1/admin/federation/peers", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ pairingCode: formData.get("code") }),
      });
      const data = await response.json();
      if (response.ok) {
        form.reset();
        await load();
        setNotice("Kods pieņemts — tagad redzēsiet otras instalācijas kopīgotos pieprasījumus.");
      } else {
        setError(data.error ?? "Savienojumu neizdevās izveidot.");
      }
    } catch {
      setError("Savienojumu neizdevās izveidot.");
    } finally {
      setLoading(false);
    }
  }

  async function copyCode() {
    await navigator.clipboard.writeText(pairingCode);
    setCopied(true);
  }

  return (
    <main className="app-main">
      <header className="app-heading">
        <div><span className="auth-step">Droša federācija</span><h1>Savienotās<br />instalācijas.</h1></div>
        <Link className="button button-ghost" href="/admin">Atpakaļ pie biedriem</Link>
      </header>
      {error && <div className="form-error">{error}</div>}
      {notice && <div className="form-success">{notice}</div>}
      <div className="admin-grid federation-admin-grid">
        <section className="data-card">
          <h2>Savienojumi</h2>
          {peers.length ? peers.map((peer) => (
            <div className="peer-row" key={peer.id}>
              <div><strong>{peer.name}</strong><small>{peer.baseUrl}</small></div>
              <div><small>{accessDescription(peer)}</small></div>
              <span className={`status-pill ${peer.status}`}>{accessLabel(peer)}</span>
            </div>
          )) : <div className="compact-form"><p className="field-help">Vēl nav savienotu instalāciju.</p></div>}
        </section>

        <section className="data-card federation-pair-card">
          <h2>Pievienot instalāciju</h2>
          <div className="pairing-explainer">
            <b>Katrs kods dod piekļuvi vienā virzienā</b>
            <p>Ievadi otras grupas kodu, lai redzētu viņu kopīgotos pieprasījumus. Viņi tavus pieprasījumus redzēs tikai tad, ja savā instalācijā ievadīs tavu kodu. Domēns ir iekļauts kodā.</p>
          </div>
          <form className="compact-form pairing-step" onSubmit={createCode}>
            <span className="pairing-step-number">1</span>
            <label htmlFor="remote-name">Otras grupas nosaukums</label>
            <input id="remote-name" className="field" value={remoteName} onChange={(event) => setRemoteName(event.target.value)} minLength={2} maxLength={160} placeholder="Piemēram, BNI Rīga Centrs" required />
            <button className="button button-accent" disabled={loading}>{pairingCode ? "Izveidot jaunu mūsu kodu" : "Izveidot mūsu kodu"}</button>
          </form>

          {pairingCode && (
            <div className="pairing-output">
              <div><b>Mūsu kods otrai pusei</b><small>Derīgs 24 stundas un izmantojams vienu reizi.</small></div>
              <div className="pairing-code">{pairingCode}</div>
              <button className="button button-ghost button-small" type="button" onClick={copyCode}>{copied ? "Nokopēts" : "Kopēt kodu"}</button>
            </div>
          )}

          <form className="compact-form pairing-step pairing-step-second" onSubmit={connect}>
            <span className="pairing-step-number">2</span>
            <label htmlFor="remote-code">Kods, ko saņēmi no otras grupas</label>
            <textarea id="remote-code" className="field" name="code" placeholder="Ielīmē otras instalācijas autentifikācijas kodu" minLength={20} maxLength={4000} required />
            <button className="button button-dark" disabled={loading}>Pievienot un skatīt pieprasījumus</button>
          </form>
        </section>
      </div>
    </main>
  );
}

function accessDescription(peer: Peer) {
  if (peer.allowIncoming && peer.allowOutgoing) return "Abas instalācijas redz viena otras kopīgotos pieprasījumus";
  if (peer.allowIncoming) return "Jūs redzat šīs instalācijas kopīgotos pieprasījumus";
  if (peer.allowOutgoing) return "Šī instalācija redz jūsu kopīgotos pieprasījumus";
  return `Protokols v${peer.protocolVersion}`;
}

function accessLabel(peer: Peer) {
  if (peer.allowIncoming && peer.allowOutgoing) return "Abpusēji";
  if (peer.allowIncoming) return "Saņemu";
  if (peer.allowOutgoing) return "Kopīgoju";
  return "Apturēts";
}
