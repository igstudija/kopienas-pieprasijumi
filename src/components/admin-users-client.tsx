"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { ExcelUserImport } from "@/components/excel-user-import";
import { useLanguage } from "@/components/language-provider";
import { adminCopy } from "@/lib/admin-i18n";

type AdminUser = {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  company: string;
  category?: string | null;
  email?: string | null;
  phoneLast4: string;
  role: "owner" | "admin" | "member";
  status: "invited" | "active" | "suspended";
  lastLoginAt?: string | null;
};

export function AdminUsersClient() {
  const { locale } = useLanguage();
  const copy = adminCopy[locale];
  const usersLoadError = copy.usersLoadError;
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [actorUserId, setActorUserId] = useState("");
  const [actorRole, setActorRole] = useState<AdminUser["role"]>("admin");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [busyUserId, setBusyUserId] = useState("");
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editRole, setEditRole] = useState<"admin" | "member">("member");
  const [newRole, setNewRole] = useState("member");
  const [showCreate, setShowCreate] = useState(false);
  const [createMode, setCreateMode] = useState<"manual" | "excel">("manual");

  async function load() {
    const response = await fetch("/api/v1/admin/users");
    const data = await response.json();
    if (response.ok) {
      setUsers(data.users);
      setActorUserId(data.actorUserId);
      setActorRole(data.actorRole);
    } else setError(usersLoadError);
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
          setActorRole(data.actorRole);
        } else setError(usersLoadError);
      })
      .catch(() => { if (active) setError(usersLoadError); });
    return () => { active = false; };
  }, [usersLoadError]);

  useEffect(() => {
    if (!showCreate && !editingUser) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape" || loading) return;
      setError("");
      setNewRole("member");
      setCreateMode("manual");
      setShowCreate(false);
      setEditingUser(null);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [editingUser, loading, showCreate]);

  const filteredUsers = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("lv");
    if (!needle) return users;
    return users.filter((user) => [user.displayName, user.company, user.category, user.email, user.phoneLast4, roleLabel(user.role, copy), statusLabel(user.status, copy)].filter(Boolean).join(" ").toLocaleLowerCase(locale).includes(needle));
  }, [copy, locale, query, users]);

  function openCreate() {
    setError("");
    setNotice("");
    setNewRole("member");
    setCreateMode("manual");
    setShowCreate(true);
  }

  function closeCreate() {
    if (loading) return;
    setError("");
    setNewRole("member");
    setCreateMode("manual");
    setShowCreate(false);
  }

  function openEdit(user: AdminUser) {
    setError("");
    setNotice("");
    setEditRole(user.role === "admin" ? "admin" : "member");
    setEditingUser(user);
  }

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");
    const form = event.currentTarget;
    const body = Object.fromEntries(new FormData(form).entries());
    try {
      const response = await fetch("/api/v1/admin/users", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      await response.json();
      if (!response.ok) setError(copy.usersCreateError);
      else {
        form.reset();
        setNewRole("member");
        setNotice(copy.usersAdded);
        await load();
        setShowCreate(false);
      }
    } catch {
      setError(copy.usersCreateError);
    } finally {
      setLoading(false);
    }
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingUser) return;
    const body = { action: "update_profile", ...Object.fromEntries(new FormData(event.currentTarget).entries()) };
    const ok = await mutateUser(editingUser.id, { method: "PATCH", body: JSON.stringify(body) }, copy.usersProfileSaved);
    if (ok) setEditingUser(null);
  }

  async function toggleStatus(user: AdminUser) {
    const nextStatus = user.status === "suspended" ? "active" : "suspended";
    await mutateUser(user.id, { method: "PATCH", body: JSON.stringify({ action: "set_status", status: nextStatus }) }, nextStatus === "active" ? copy.usersActivated : copy.usersDeactivated);
  }

  async function remove(user: AdminUser) {
    const confirmed = window.confirm(`${user.displayName}: ${copy.usersDeleteConfirm}`);
    if (!confirmed) return;
    await mutateUser(user.id, { method: "DELETE" }, copy.usersDeleted);
  }

  async function mutateUser(userId: string, init: RequestInit, successMessage: string) {
    setBusyUserId(userId);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/v1/admin/users/${userId}`, { ...init, headers: { "content-type": "application/json", ...init.headers } });
      await response.json();
      if (!response.ok) { setError(copy.usersUpdateError); return false; }
      setNotice(successMessage);
      await load();
      return true;
    } catch {
      setError(copy.usersUpdateError);
      return false;
    } finally {
      setBusyUserId("");
    }
  }

  return (
    <main className="app-main">
      <div className="app-page-actions"><button className="button button-accent" type="button" onClick={openCreate}>{copy.usersAdd}</button></div>
      {error && !showCreate && !editingUser && <div className="form-error">{error}</div>}
      {notice && <div className="form-success">{notice}</div>}
      <section className="data-card users-list-card">
        <header className="list-card-header"><span className="list-card-count">{filteredUsers.length} / {users.length}</span><input className="search-input" type="search" placeholder={copy.usersSearch} value={query} onChange={(event) => setQuery(event.target.value)} aria-label={copy.usersSearchAria} /></header>
        {filteredUsers.length ? filteredUsers.map((user) => {
          const protectedUser = user.role === "owner" || user.id === actorUserId;
          const busy = busyUserId === user.id;
          return (
            <div className="user-row admin-user-row" key={user.id}>
              <div><strong>{user.displayName}</strong><small>{user.company} · •••• {user.phoneLast4}{user.email ? ` · ${user.email}` : ""}</small></div>
              <div><small>{user.category ?? copy.usersNoCategory}</small></div>
              <span className={`status-pill ${user.status}`}>{roleLabel(user.role, copy)} · {statusLabel(user.status, copy)}</span>
              <div className="user-actions">
                <button className="row-action" type="button" onClick={() => openEdit(user)} disabled={busy}>{copy.usersEdit}</button>
                <button className="row-action" type="button" onClick={() => toggleStatus(user)} disabled={busy || protectedUser}>{user.status === "suspended" ? copy.activate : copy.deactivate}</button>
                <button className="row-action row-action-danger" type="button" onClick={() => remove(user)} disabled={busy || protectedUser}>{copy.delete}</button>
              </div>
            </div>
          );
        }) : <div className="empty-card-state">{copy.usersEmpty}</div>}
      </section>
      {showCreate && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeCreate(); }}>
          <section className={`modal-card ${createMode === "excel" ? "excel-modal" : ""}`} role="dialog" aria-modal="true" aria-labelledby="create-user-title">
            <header className="modal-header"><div><span className="auth-step">{copy.usersCreateEyebrow}</span><h2 id="create-user-title">{copy.usersCreateTitle}</h2></div><button className="modal-close" type="button" onClick={closeCreate} disabled={loading} aria-label={copy.close}>×</button></header>
            <p className="modal-intro">{copy.usersCreateIntro}</p>
            <div className="modal-tabs" role="tablist" aria-label={copy.usersModeAria}><button type="button" role="tab" aria-selected={createMode === "manual"} className={createMode === "manual" ? "active" : ""} onClick={() => { setError(""); setCreateMode("manual"); }}>{copy.usersManual}</button><button type="button" role="tab" aria-selected={createMode === "excel"} className={createMode === "excel" ? "active" : ""} onClick={() => { setError(""); setCreateMode("excel"); }}>{copy.usersExcel}</button></div>
            {createMode === "manual" ? <form className="modal-form" onSubmit={create}>
              <div className="form-grid">
                <div className="form-group"><label htmlFor="new-first-name">{copy.firstName}</label><input className="field" id="new-first-name" name="firstName" autoFocus required /></div>
                <div className="form-group"><label htmlFor="new-last-name">{copy.lastName}</label><input className="field" id="new-last-name" name="lastName" required /></div>
                <div className="form-group"><label htmlFor="new-company">{copy.company}</label><input className="field" id="new-company" name="company" required /></div>
                <div className="form-group"><label htmlFor="new-category">{copy.category}</label><input className="field" id="new-category" name="category" /></div>
                <div className="form-group"><label htmlFor="new-phone">{copy.phone}</label><input className="field" id="new-phone" name="phone" type="tel" inputMode="tel" placeholder="+371 2…" required /></div>
                <div className="form-group"><label htmlFor="new-email">{copy.emailOptional}</label><input className="field" id="new-email" name="email" type="email" /></div>
                <div className="form-group full"><label htmlFor="new-role">{copy.accessType}</label><select className="field" id="new-role" name="role" value={newRole} onChange={(event) => setNewRole(event.target.value)}><option value="member">{copy.roleMemberWhatsapp}</option><option value="admin">{copy.roleAdminPassword}</option></select></div>
                {newRole === "admin" && <div className="form-group full"><label htmlFor="new-password">{copy.initialPassword}</label><input className="field" id="new-password" name="password" type="password" minLength={12} maxLength={200} autoComplete="new-password" placeholder={copy.passwordMin} required /></div>}
              </div>
              {error && <div className="form-error">{error}</div>}
              <div className="modal-actions"><button className="button button-ghost" type="button" onClick={closeCreate} disabled={loading}>{copy.cancel}</button><button className="button button-accent" disabled={loading}>{loading ? copy.usersAdding : copy.usersAdd}</button></div>
            </form> : <ExcelUserImport onCancel={closeCreate} onImported={async (result) => { await load(); if (!result.errors.length) { setNotice(`${copy.usersImported} ${result.imported}`); setShowCreate(false); } }} />}
          </section>
        </div>
      )}

      {editingUser && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !busyUserId) setEditingUser(null); }}>
          <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="edit-user-title">
            <header className="modal-header"><div><span className="auth-step">{copy.usersProfileEyebrow}</span><h2 id="edit-user-title">{copy.usersEditTitle}</h2></div><button className="modal-close" type="button" onClick={() => setEditingUser(null)} disabled={Boolean(busyUserId)} aria-label={copy.close}>×</button></header>
            <p className="modal-intro">{copy.usersEditIntro}</p>
            <form onSubmit={saveProfile}>
              <div className="form-grid">
                <div className="form-group"><label htmlFor="edit-first-name">{copy.firstName}</label><input className="field" id="edit-first-name" name="firstName" defaultValue={editingUser.firstName} required /></div>
                <div className="form-group"><label htmlFor="edit-last-name">{copy.lastName}</label><input className="field" id="edit-last-name" name="lastName" defaultValue={editingUser.lastName} required /></div>
                <div className="form-group"><label htmlFor="edit-company">{copy.company}</label><input className="field" id="edit-company" name="company" defaultValue={editingUser.company} required /></div>
                <div className="form-group"><label htmlFor="edit-category">{copy.category}</label><input className="field" id="edit-category" name="category" defaultValue={editingUser.category ?? ""} /></div>
                <div className="form-group"><label htmlFor="edit-email">{copy.email}</label><input className="field" id="edit-email" name="email" type="email" defaultValue={editingUser.email ?? ""} /></div>
                <div className="form-group"><label htmlFor="edit-phone">{copy.newWhatsappPhone}</label><input className="field" id="edit-phone" name="phone" type="tel" inputMode="tel" placeholder={`${copy.currentPhone} •••• ${editingUser.phoneLast4}`} /></div>
                {actorRole === "owner" && editingUser.role !== "owner" && editingUser.id !== actorUserId && <div className="form-group full"><label htmlFor="edit-role">{copy.role}</label><select className="field" id="edit-role" name="role" value={editRole} onChange={(event) => setEditRole(event.target.value as "admin" | "member")}><option value="member">{copy.roleMember}</option><option value="admin">{copy.roleAdmin}</option></select></div>}
                {actorRole === "owner" && editingUser.role !== "owner" && editRole === "admin" && <div className="form-group full"><label htmlFor="edit-password">{copy.newAdminPassword}</label><input className="field" id="edit-password" name="password" type="password" minLength={12} maxLength={200} autoComplete="new-password" placeholder={copy.leaveBlank} /></div>}
              </div>
              {error && <div className="form-error">{error}</div>}
              <div className="modal-actions"><button className="button button-ghost" type="button" onClick={() => setEditingUser(null)} disabled={Boolean(busyUserId)}>{copy.cancel}</button><button className="button button-accent" disabled={Boolean(busyUserId)}>{busyUserId ? copy.saving : copy.usersSave}</button></div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}

function roleLabel(role: AdminUser["role"], copy: (typeof adminCopy)["lv"]) {
  if (role === "owner") return copy.roleOwner;
  if (role === "admin") return copy.roleAdmin;
  return copy.roleMember;
}

function statusLabel(status: AdminUser["status"], copy: (typeof adminCopy)["lv"]) {
  if (status === "suspended") return copy.statusSuspended;
  if (status === "invited") return copy.statusInvited;
  return copy.statusActive;
}
