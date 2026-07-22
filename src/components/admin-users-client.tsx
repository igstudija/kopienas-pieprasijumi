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
        <Link className="button button-dark" href="/admin/federation">Savienotās instalācijas</Link>
      </header>
      {error && <div className="form-error">{error}</div>}
      {notice && <div className="form-success">{notice}</div>}
      <div className="admin-grid users-admin-grid">
        <section className="data-card">
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
        <section className="data-card">
          <h2>Pievienot biedru</h2>
          <form className="compact-form" onSubmit={create}>
            <input className="field" name="firstName" placeholder="Vārds" required />
            <input className="field" name="lastName" placeholder="Uzvārds" required />
            <input className="field" name="company" placeholder="Uzņēmums" required />
            <input className="field" name="category" placeholder="Nozare / kategorija" />
            <input className="field" name="phone" type="tel" placeholder="+371 2…" required />
            <input className="field" name="email" type="email" placeholder="E-pasts (neobligāti)" />
            <select className="field" name="role" value={newRole} onChange={(event) => setNewRole(event.target.value)}>
              <option value="member">Biedrs — ieeja ar WhatsApp</option>
              <option value="admin">Administrators — arī ar paroli</option>
            </select>
            {newRole === "admin" && <input className="field" name="password" type="password" minLength={12} maxLength={200} autoComplete="new-password" placeholder="Sākotnējā admina parole (12+)" required />}
            <button className="button button-accent" disabled={loading}>{loading ? "Pievienojam…" : "Pievienot biedru"}</button>
          </form>
        </section>
      </div>
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
