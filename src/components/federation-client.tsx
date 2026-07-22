"use client";

import { FormEvent, useEffect, useState } from "react";
import { pairingCodePreview, type PairingCodePreview } from "@/lib/federation-code";
import { useLanguage } from "@/components/language-provider";
import { EditIcon, PauseIcon, PlayIcon, TrashIcon } from "@/components/icons";
import { adminCopy } from "@/lib/admin-i18n";

type CodeState = "missing" | "created" | "accepted";

type Peer = {
  id: string;
  remoteInstanceId: string | null;
  name: string;
  baseUrl: string | null;
  status: "active" | "paused" | "revoked" | "pending";
  protocolVersion: number;
  allowIncoming: boolean;
  allowOutgoing: boolean;
  remoteCodeState: CodeState;
  localCodeState: CodeState;
};

export function FederationClient() {
  const { locale } = useLanguage();
  const copy = adminCopy[locale];
  const peersLoadError = copy.peersLoadError;
  const [peers, setPeers] = useState<Peer[]>([]);
  const [modalMode, setModalMode] = useState<"add" | "edit" | null>(null);
  const [editingPeer, setEditingPeer] = useState<Peer | null>(null);
  const [pairingCode, setPairingCode] = useState("");
  const [ourCodePreview, setOurCodePreview] = useState<PairingCodePreview | null>(null);
  const [remoteCode, setRemoteCode] = useState("");
  const [remoteCodePreview, setRemoteCodePreview] = useState<PairingCodePreview | null>(null);
  const [remoteCodeError, setRemoteCodeError] = useState("");
  const [remoteName, setRemoteName] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [busyPeerId, setBusyPeerId] = useState("");
  const [copied, setCopied] = useState(false);

  async function load() {
    const response = await fetch("/api/v1/admin/federation/peers");
    const data = await response.json();
    if (response.ok) setPeers(data.peers);
    else setError(peersLoadError);
  }

  useEffect(() => {
    let active = true;
    fetch("/api/v1/admin/federation/peers")
      .then(async (response) => ({ response, data: await response.json() }))
      .then(({ response, data }) => {
        if (!active) return;
        if (response.ok) setPeers(data.peers);
        else setError(peersLoadError);
      })
      .catch(() => { if (active) setError(peersLoadError); });
    return () => { active = false; };
  }, [peersLoadError]);

  useEffect(() => {
    if (!modalMode) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !loading) setModalMode(null);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [loading, modalMode]);

  function resetCodeFields() {
    setPairingCode("");
    setOurCodePreview(null);
    setRemoteCode("");
    setRemoteCodePreview(null);
    setRemoteCodeError("");
    setCopied(false);
  }

  function openAdd() {
    setError("");
    setNotice("");
    setRemoteName("");
    resetCodeFields();
    setEditingPeer(null);
    setModalMode("add");
  }

  function openEdit(peer: Peer) {
    setError("");
    setNotice("");
    resetCodeFields();
    setEditingPeer(peer);
    setRemoteName(peer.name);
    setModalMode("edit");
  }

  function closeModal() {
    if (!loading) setModalMode(null);
  }

  async function createDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/v1/admin/federation/peers", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: remoteName }),
      });
      await response.json();
      if (!response.ok) throw new Error(copy.peersAddError);
      await load();
      setNotice(copy.peersDraftSaved);
      setModalMode(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : copy.peersAddError);
    } finally {
      setLoading(false);
    }
  }

  async function generateCode() {
    if (!editingPeer) return;
    setLoading(true);
    setError("");
    setCopied(false);
    try {
      const response = await fetch("/api/v1/admin/federation/invites", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ label: remoteName, peerId: editingPeer.id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(copy.peersCodeError);
      setPairingCode(data.pairingCode);
      setOurCodePreview(pairingCodePreview(data.pairingCode));
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : copy.peersCodeError);
    } finally {
      setLoading(false);
    }
  }

  function changeRemoteCode(value: string) {
    setRemoteCode(value);
    setRemoteCodePreview(null);
    setRemoteCodeError("");
    if (!value.trim()) return;
    try {
      const preview = pairingCodePreview(value);
      setRemoteCodePreview(preview);
      if (new Date(preview.expiresAt) <= new Date()) setRemoteCodeError(copy.peersExpired);
    } catch {
      setRemoteCodeError(copy.peersInvalid);
    }
  }

  async function connect(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingPeer || !remoteCodePreview || remoteCodeError) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/v1/admin/federation/peers", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ peerId: editingPeer.id, pairingCode: remoteCode }),
      });
      await response.json();
      if (!response.ok) throw new Error(copy.peersConnectError);
      await load();
      setNotice(copy.peersConnected);
      setModalMode(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : copy.peersConnectError);
    } finally {
      setLoading(false);
    }
  }

  async function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingPeer) return;
    const ok = await mutatePeer(editingPeer.id, {
      method: "PATCH",
      body: JSON.stringify({ name: remoteName }),
    }, copy.peersNameSaved);
    if (ok) setModalMode(null);
  }

  async function toggleStatus(peer: Peer) {
    const nextStatus = peer.status === "paused" ? (peer.remoteInstanceId ? "active" : "pending") : "paused";
    await mutatePeer(peer.id, {
      method: "PATCH",
      body: JSON.stringify({ status: nextStatus }),
    }, nextStatus === "paused" ? copy.peersPaused : copy.peersActivated);
  }

  async function remove(peer: Peer) {
    if (!window.confirm(`${peer.name}: ${copy.peersDeleteConfirm}`)) return;
    await mutatePeer(peer.id, { method: "DELETE" }, copy.peersDeleted);
  }

  async function mutatePeer(peerId: string, init: RequestInit, successMessage: string) {
    setBusyPeerId(peerId);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/v1/admin/federation/peers/${peerId}`, {
        ...init,
        headers: { "content-type": "application/json" },
      });
      await response.json();
      if (!response.ok) throw new Error(copy.peersUpdateError);
      await load();
      setNotice(successMessage);
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : copy.peersUpdateError);
      return false;
    } finally {
      setBusyPeerId("");
    }
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(pairingCode);
      setCopied(true);
    } catch {
      setError(copy.peersCopyError);
    }
  }

  return (
    <main className="app-main">
      <div className="app-page-actions"><button className="button button-accent" type="button" onClick={openAdd}>{copy.peersAdd}</button></div>
      {error && !modalMode && <div className="form-error">{error}</div>}
      {notice && <div className="form-success">{notice}</div>}
      <section className="data-card portals-list-card">
        {peers.length ? peers.map((peer) => (
          <div className="peer-row portal-row" key={peer.id}>
            <div><strong>{peer.name}</strong><small>{peer.baseUrl ? domainFromUrl(peer.baseUrl) : copy.peersNoDomain}</small></div>
            <div className="portal-code-markers">
              <CodeMarker label={copy.peersTheirCode} state={peer.remoteCodeState} copy={copy} />
              <CodeMarker label={copy.peersOurCode} state={peer.localCodeState} local copy={copy} />
            </div>
            {peer.status === "pending" ? <span aria-hidden="true" /> : <span className={`status-pill ${peer.status}`}>{portalStatusLabel(peer, copy)}</span>}
            <div className="user-actions portal-actions">
              <button className="row-action icon-action" type="button" onClick={() => openEdit(peer)} disabled={busyPeerId === peer.id} aria-label={copy.peersEdit} title={copy.peersEdit}><EditIcon /></button>
              <button className="row-action icon-action" type="button" onClick={() => toggleStatus(peer)} disabled={busyPeerId === peer.id} aria-label={peer.status === "paused" ? copy.activate : copy.deactivate} title={peer.status === "paused" ? copy.activate : copy.deactivate}>{peer.status === "paused" ? <PlayIcon /> : <PauseIcon />}</button>
              <button className="row-action row-action-danger icon-action" type="button" onClick={() => remove(peer)} disabled={busyPeerId === peer.id} aria-label={copy.delete} title={copy.delete}><TrashIcon /></button>
            </div>
          </div>
        )) : <div className="empty-card-state">{copy.peersEmpty}</div>}
      </section>

      {modalMode && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeModal(); }}>
          <section className="modal-card federation-modal" role="dialog" aria-modal="true" aria-labelledby="portal-modal-title">
            <header className="modal-header">
              <div><span className="auth-step">{modalMode === "add" ? copy.peersNew : copy.peersSettings}</span><h2 id="portal-modal-title">{modalMode === "add" ? copy.peersAddTitle : `${copy.peersEditTitle}: ${editingPeer?.name}`}</h2></div>
              <button className="modal-close" type="button" onClick={closeModal} disabled={loading} aria-label={copy.close}>×</button>
            </header>

            {modalMode === "add" ? (
              <form className="modal-form portal-draft-form" onSubmit={createDraft}>
                <p className="modal-intro">{copy.peersDraftIntro}</p>
                <div className="form-group"><label htmlFor="new-peer-name">{copy.peersOtherName}</label><input className="field" id="new-peer-name" value={remoteName} onChange={(event) => setRemoteName(event.target.value)} minLength={2} maxLength={160} autoFocus required /></div>
                {error && <div className="form-error">{error}</div>}
                <div className="modal-actions"><button className="button button-ghost" type="button" onClick={closeModal}>{copy.cancel}</button><button className="button button-accent" disabled={loading}>{loading ? copy.peersAdding : copy.peersAddList}</button></div>
              </form>
            ) : editingPeer && (
              <div className="portal-edit-content">
                <form className="modal-form portal-name-form" onSubmit={saveEdit}>
                  <div className="form-group"><label htmlFor="edit-peer-name">{copy.peersName}</label><input className="field" id="edit-peer-name" value={remoteName} onChange={(event) => setRemoteName(event.target.value)} minLength={2} maxLength={160} autoFocus required /></div>
                  <div className="code-domain-card"><span>{copy.peersDomain}</span><strong>{editingPeer.baseUrl ? domainFromUrl(editingPeer.baseUrl) : copy.peersNotReceived}</strong><small>{copy.peersDomainHelp}</small></div>
                  <button className="button button-ghost button-small save-peer-name" disabled={loading}>{copy.peersSaveName}</button>
                </form>

                <section className="portal-code-section">
                  <header><div><span className="pairing-step-number">1</span><b>{copy.peersOurCodeTitle}</b><p>{copy.peersOurCodeHelp}</p></div><CodeMarker label={copy.peersOurCode} state={pairingCode ? "created" : editingPeer.localCodeState} local copy={copy} /></header>
                  <button className="button button-accent button-small" type="button" onClick={generateCode} disabled={loading}>{pairingCode ? copy.peersCreateNewCode : copy.peersCreateCode}</button>
                  {pairingCode && ourCodePreview && <div className="pairing-output edit-pairing-output"><div><b>{copy.peersCodeReady}</b><small>{copy.peersCodeValidity}</small></div><div className="code-domain-card compact"><span>{copy.peersEmbeddedDomain}</span><strong>{ourCodePreview.domain}</strong></div><div className="pairing-code">{pairingCode}</div><button className="button button-ghost button-small" type="button" onClick={copyCode}>{copied ? copy.peersCopied : copy.peersCopy}</button></div>}
                </section>

                <form className="portal-code-section" onSubmit={connect}>
                  <header><div><span className="pairing-step-number">2</span><b>{copy.peersTheirCodeTitle}</b><p>{copy.peersTheirCodeHelp}</p></div><CodeMarker label={copy.peersTheirCode} state={editingPeer.remoteCodeState} copy={copy} /></header>
                  <div className="form-group"><label htmlFor="remote-code">{copy.peersReceivedCode}</label><textarea id="remote-code" className="field" value={remoteCode} onChange={(event) => changeRemoteCode(event.target.value)} placeholder={copy.peersPasteCode} minLength={20} maxLength={4000} required /></div>
                  {remoteCodePreview && <div className="code-domain-card"><span>{copy.peersReceivedDomain}</span><strong>{remoteCodePreview.domain}</strong>{remoteCodePreview.issuerName && <small>{copy.peersIssuer}: {remoteCodePreview.issuerName}</small>}</div>}
                  {remoteCodeError && <div className="form-error">{remoteCodeError}</div>}
                  <button className="button button-dark button-small" disabled={loading || !remoteCodePreview || Boolean(remoteCodeError)}>{editingPeer.remoteCodeState === "accepted" ? copy.peersUpdateCode : copy.peersEnterCode}</button>
                </form>
                {error && <div className="form-error">{error}</div>}
                <div className="modal-actions"><button className="button button-ghost" type="button" onClick={closeModal}>{copy.close}</button></div>
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}

function CodeMarker({ label, state, copy, local = false }: { label: string; state: CodeState; copy: (typeof adminCopy)["lv"]; local?: boolean }) {
  const text = state === "accepted" ? (local ? copy.markerActivated : copy.markerEntered) : state === "created" ? copy.markerCreated : copy.markerMissing;
  return <span className={`code-marker ${state}`}><i>{state === "missing" ? "—" : "✓"}</i>{label}: {text}</span>;
}

function domainFromUrl(value: string) {
  try { return new URL(value).origin; } catch { return value; }
}

function portalStatusLabel(peer: Peer, copy: (typeof adminCopy)["lv"]) {
  if (peer.status === "paused") return copy.peerPaused;
  if (peer.status === "pending") return copy.peerPending;
  if (peer.allowIncoming && peer.allowOutgoing) return copy.peerBoth;
  if (peer.allowIncoming) return copy.peerIncoming;
  if (peer.allowOutgoing) return copy.peerOutgoing;
  return copy.peerPending;
}
