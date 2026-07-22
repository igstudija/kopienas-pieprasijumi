"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

type AdminUser = {
  id: string;
  displayName: string;
  company: string;
  category?: string | null;
  phoneLast4: string;
  role: "owner" | "admin" | "member";
  status: "invited" | "active" | "suspended";
  lastLoginAt?: string | null;
};

export function AdminUsersClient() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [actorUserId, setActorUserId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [busyUserId, setBusyUserId] = useState("");
  const [editingPhoneId, setEditingPhoneId] = useState("");
  const [newRole, setNewRole] = useState("member");
  const [showCreate, setShowCreate] = useState(false);

  async function load() {
    const response = await fetch("/api/v1/admin/users");
    const data = await response.json();
    if (response.ok) {
      setUsers(data.users);
      setActorUserId(data.actorUserId);
    } else {
      setError(data.error ?? "Lietotājus neizdevās ielādēt.");
    }
  }

  useEffect(() => {
    let active = true;
    fetch("/api/v1/admin/users")
      .then(async (response) => ({ response, data: await response.json() }))
      .then(({ response, data }) => {
        if (!active) return;
        if (response.ok) {
          setUsers(data.users);
          setActorUserId(data.actorUserId);
        } else setError(data.error ?? "Lietotājus neizdevās ielādēt.");
      })
      .catch(() => {
        if (active) setError("Lietotājus neizdevās ielādēt.");
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!showCreate) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !loading) {
        setError("");
        setNewRole("member");
        setShowCreate(false);
      }
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [loading, showCreate]);

  function openCreate() {
    setError("");
    setNotice("");
    setNewRole("member");
    setShowCreate(true);
  }

  function closeCreate() {
    if (loading) return;
    setError("");
    setNewRole("member");
    setShowCreate(false);
  }

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");
    const form = event.currentTarget;
    const body = Object.fromEntries(new FormData(form).entries());
    try {
      const response = await fetch("/api/v1/admin/users", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) setError(data.error ?? "Lietotāju neizdevās izveidot.");
      else {
        form.reset();
        setNewRole("member");
        setNotice("Lietotājs ir pievienots.");
        await load();
        setShowCreate(false);
      }
    } catch {
      setError("Lietotāju neizdevās izveidot.");
    } finally {
      setLoading(false);
    }
  }

  async function updatePhone(event: FormEvent<HTMLFormElement>, user: AdminUser) {
    event.preventDefault();
    const form = event.currentTarget;
    const phone = new FormData(form).get("phone");
    const ok = await mutateUser(user.id, {
      method: "PATCH",
      body: JSON.stringify({ action: "update_phone", phone }),
    }, `Tālruņa numurs lietotājam “${user.displayName}” ir nomainīts.`);
    if (ok) setEditingPhoneId("");
  }

  async function toggleStatus(user: AdminUser) {
    const nextStatus = user.status === "suspended" ? "active" : "suspended";
    await mutateUser(user.id, {
      method: "PATCH",
      body: JSON.stringify({ action: "set_status", status: nextStatus }),
    }, nextStatus === "active" ? "Lietotājs ir aktivizēts." : "Lietotājs ir deaktivizēts un viņa sesijas pārtrauktas.");
  }

  async function remove(user: AdminUser) {
    const confirmed = window.confirm(
      `Vai tiešām dzēst lietotāju “${user.displayName}”? Piekļuve un personas dati tiks neatgriezeniski noņemti, bet vēsturiskie pieprasījumi tiks saglabāti anonīmi.`,
    );
    if (!confirmed) return;
    await mutateUser(user.id, { method: "DELETE" }, "Lietotājs un viņa personas dati ir dzēsti.");
  }

  async function mutateUser(userId: string, init: RequestInit, successMessage: string) {
    setBusyUserId(userId);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/v1/admin/users/${userId}`, {
        ...init,
        headers: { "content-type": "application/json", ...init.headers },
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Lietotāju neizdevās atjaunināt.");
        return false;
      }
      setNotice(successMessage);
      await load();
      return true;
    } catch {
      setError("Lietotāju neizdevās atjaunināt.");
      return false;
    } finally {
      setBusyUserId("");
    }
  }

  return (
    <main className="app-main">
      <header className="app-heading">
        <div><span className="auth-step">Instances administrācija</span><h1>Biedri un<br />piekļuves.</h1></div>
        <div className="app-heading-actions">
          <button className="button button-accent" type="button" onClick={openCreate}>Pievienot biedru</button>
          <Link className="button button-dark" href="/admin/federation">Savienotās instalācijas</Link>
        </div>
      </header>
      {error && !showCreate && <div className="form-error">{error}</div>}
      {notice && <div className="form-success">{notice}</div>}
      <section className="data-card users-list-card">
        <h2>Reģistrētie biedri</h2>
        {users.map((user) => {
          const protectedUser = user.role === "owner" || user.id === actorUserId;
          const busy = busyUserId === user.id;
          return (
            <div className="user-row admin-user-row" key={user.id}>
              <div><strong>{user.displayName}</strong><small>{user.company} · •••• {user.phoneLast4}</small></div>
              <div><small>{user.category ?? "Nav kategorijas"}</small></div>
              <span className={`status-pill ${user.status}`}>{roleLabel(user.role)} · {statusLabel(user.status)}</span>
              <div className="user-actions">
                <button className="row-action" type="button" onClick={() => setEditingPhoneId(editingPhoneId === user.id ? "" : user.id)} disabled={busy}>Mainīt tālruni</button>
                <button className="row-action" type="button" onClick={() => toggleStatus(user)} disabled={busy || protectedUser}>{user.status === "suspended" ? "Aktivizēt" : "Deaktivizēt"}</button>
                <button className="row-action row-action-danger" type="button" onClick={() => remove(user)} disabled={busy || protectedUser}>Dzēst</button>
              </div>
              {editingPhoneId === user.id && (
                <form className="user-phone-form" onSubmit={(event) => updatePhone(event, user)}>
                  <input className="field" name="phone" type="tel" inputMode="tel" placeholder="Jaunais numurs, piemēram, +371 2…" required />
                  <button className="button button-dark button-small" disabled={busy}>Saglabāt</button>
                  <button className="button button-ghost button-small" type="button" onClick={() => setEditingPhoneId("")}>Atcelt</button>
                </form>
              )}
            </div>
          );
        })}
      </section>

      {showCreate && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeCreate(); }}>
          <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="create-user-title">
            <header className="modal-header">
              <div><span className="auth-step">Jauna piekļuve</span><h2 id="create-user-title">Pievienot biedru</h2></div>
              <button className="modal-close" type="button" onClick={closeCreate} disabled={loading} aria-label="Aizvērt">×</button>
            </header>
            <p className="modal-intro">Pievieno biedru ar WhatsApp ieeju vai administratoru ar sākotnējo paroli.</p>
            <form className="modal-form" onSubmit={create}>
              <div className="form-grid">
                <div className="form-group"><label htmlFor="new-first-name">Vārds</label><input className="field" id="new-first-name" name="firstName" autoFocus required /></div>
                <div className="form-group"><label htmlFor="new-last-name">Uzvārds</label><input className="field" id="new-last-name" name="lastName" required /></div>
                <div className="form-group"><label htmlFor="new-company">Uzņēmums</label><input className="field" id="new-company" name="company" required /></div>
                <div className="form-group"><label htmlFor="new-category">Nozare / kategorija</label><input className="field" id="new-category" name="category" /></div>
                <div className="form-group"><label htmlFor="new-phone">Tālruņa numurs</label><input className="field" id="new-phone" name="phone" type="tel" inputMode="tel" placeholder="+371 2…" required /></div>
                <div className="form-group"><label htmlFor="new-email">E-pasts (neobligāti)</label><input className="field" id="new-email" name="email" type="email" /></div>
                <div className="form-group full"><label htmlFor="new-role">Piekļuves veids</label><select className="field" id="new-role" name="role" value={newRole} onChange={(event) => setNewRole(event.target.value)}><option value="member">Biedrs — ieeja ar WhatsApp</option><option value="admin">Administrators — arī ar paroli</option></select></div>
                {newRole === "admin" && <div className="form-group full"><label htmlFor="new-password">Sākotnējā administratora parole</label><input className="field" id="new-password" name="password" type="password" minLength={12} maxLength={200} autoComplete="new-password" placeholder="Vismaz 12 rakstzīmes" required /></div>}
              </div>
              {error && <div className="form-error">{error}</div>}
              <div className="modal-actions">
                <button className="button button-ghost" type="button" onClick={closeCreate} disabled={loading}>Atcelt</button>
                <button className="button button-accent" disabled={loading}>{loading ? "Pievienojam…" : "Pievienot biedru"}</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}

function roleLabel(role: AdminUser["role"]) {
  if (role === "owner") return "Īpašnieks";
  if (role === "admin") return "Administrators";
  return "Biedrs";
}

function statusLabel(status: AdminUser["status"]) {
  if (status === "suspended") return "Deaktivizēts";
  if (status === "invited") return "Uzaicināts";
  return "Aktīvs";
}
