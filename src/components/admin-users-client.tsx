"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { ExcelUserImport } from "@/components/excel-user-import";
import { EditIcon, PauseIcon, PlayIcon, TrashIcon } from "@/components/icons";
import { useLanguage } from "@/components/language-provider";
import { PhoneInput } from "@/components/phone-input";
import { adminCopy } from "@/lib/admin-i18n";
import { fetchJson, isAbortError, jsonRequest } from "@/lib/client-api";
import type { Locale } from "@/lib/i18n";
import { phoneCountryFromLocale } from "@/lib/phone-number";
import { useModalDialog } from "@/lib/use-modal-dialog";

type AdminUser = {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  company: string;
  category?: string | null;
  email?: string | null;
  phone: string;
  role: "owner" | "admin" | "member";
  status: "invited" | "active" | "suspended";
  lastLoginAt?: string | null;
};
type UsersResponse = { users: AdminUser[]; actorUserId: string; actorRole: AdminUser["role"] };

export function AdminUsersClient() {
  const { locale } = useLanguage();
  const copy = adminCopy[locale];
  const editIntro = {
    lv: "E-pasts tiek izmantots autorizācijai. Mainot e-pastu, aktīvās sesijas tiek pārtrauktas. Tālruņa numurs tiek saglabāts starptautiskajā formātā.",
    en: "Email is used for sign-in. Changing it revokes active sessions. The phone number is stored in international format.",
    lt: "El. paštas naudojamas prisijungimui. Jį pakeitus aktyvios sesijos nutraukiamos. Telefono numeris saugomas tarptautiniu formatu.",
    et: "E-posti kasutatakse sisselogimiseks. Selle muutmisel lõpetatakse aktiivsed seansid. Telefoninumber salvestatakse rahvusvahelises vormingus.",
  }[locale];
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
  const dialogRef = useModalDialog<HTMLElement>(Boolean(showCreate || editingUser), () => {
    setError("");
    setNewRole("member");
    setCreateMode("manual");
    setShowCreate(false);
    setEditingUser(null);
  }, loading || Boolean(busyUserId));

  const load = useCallback(async (signal?: AbortSignal) => {
    const data = await fetchJson<UsersResponse>("/api/v1/admin/users", { signal });
    setUsers(data.users);
    setActorUserId(data.actorUserId);
    setActorRole(data.actorRole);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchJson<UsersResponse>("/api/v1/admin/users", { signal: controller.signal })
      .then((data) => {
        setUsers(data.users);
        setActorUserId(data.actorUserId);
        setActorRole(data.actorRole);
      })
      .catch((cause: unknown) => {
        if (!isAbortError(cause)) setError(usersLoadError);
      });
    return () => controller.abort();
  }, [usersLoadError]);

  const filteredUsers = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase(locale);
    if (!needle) return users;
    return users.filter((user) => [user.displayName, user.company, user.category, user.email, user.phone, roleLabel(user.role, copy), statusLabel(user.status, copy)].filter(Boolean).join(" ").toLocaleLowerCase(locale).includes(needle));
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
      await fetchJson("/api/v1/admin/users", jsonRequest("POST", body));
      form.reset();
      setNewRole("member");
      setNotice(copy.usersAdded);
      await load();
      setShowCreate(false);
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
      await fetchJson(`/api/v1/admin/users/${userId}`, {
        ...init,
        headers: init.body ? { "content-type": "application/json", ...init.headers } : init.headers,
      });
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
              <div><strong>{user.displayName}</strong><small>{user.company} · {user.phone} · {formatAdminEmail(user.email, locale)}</small></div>
              <div><small>{user.category ?? copy.usersNoCategory}</small></div>
              <span className={`status-pill ${user.status}`}>{roleLabel(user.role, copy)} · {statusLabel(user.status, copy)}</span>
              <div className="user-actions">
                <button className="row-action icon-action" type="button" onClick={() => openEdit(user)} disabled={busy} aria-label={copy.usersEdit} title={copy.usersEdit}><EditIcon /></button>
                <button className="row-action icon-action" type="button" onClick={() => toggleStatus(user)} disabled={busy || protectedUser} aria-label={user.status === "suspended" ? copy.activate : copy.deactivate} title={user.status === "suspended" ? copy.activate : copy.deactivate}>{user.status === "suspended" ? <PlayIcon /> : <PauseIcon />}</button>
                <button className="row-action row-action-danger icon-action" type="button" onClick={() => remove(user)} disabled={busy || protectedUser} aria-label={copy.delete} title={copy.delete}><TrashIcon /></button>
              </div>
            </div>
          );
        }) : <div className="empty-card-state">{copy.usersEmpty}</div>}
      </section>
      {showCreate && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeCreate(); }}>
          <section ref={dialogRef} className={`modal-card ${createMode === "excel" ? "excel-modal" : ""}`} role="dialog" aria-modal="true" aria-labelledby="create-user-title" tabIndex={-1}>
            <header className="modal-header"><div><span className="auth-step">{copy.usersCreateEyebrow}</span><h2 id="create-user-title">{copy.usersCreateTitle}</h2></div><button className="modal-close" type="button" onClick={closeCreate} disabled={loading} aria-label={copy.close}>×</button></header>
            <p className="modal-intro">{copy.usersCreateIntro}</p>
            <div className="modal-tabs" role="tablist" aria-label={copy.usersModeAria}><button type="button" role="tab" aria-selected={createMode === "manual"} className={createMode === "manual" ? "active" : ""} onClick={() => { setError(""); setCreateMode("manual"); }}>{copy.usersManual}</button><button type="button" role="tab" aria-selected={createMode === "excel"} className={createMode === "excel" ? "active" : ""} onClick={() => { setError(""); setCreateMode("excel"); }}>{copy.usersExcel}</button></div>
            {createMode === "manual" ? <form className="modal-form" onSubmit={create}>
              <div className="form-grid">
                <div className="form-group"><label htmlFor="new-first-name">{copy.firstName}</label><input className="field" id="new-first-name" name="firstName" autoFocus required /></div>
                <div className="form-group"><label htmlFor="new-last-name">{copy.lastName}</label><input className="field" id="new-last-name" name="lastName" required /></div>
                <div className="form-group"><label htmlFor="new-company">{copy.company}</label><input className="field" id="new-company" name="company" required /></div>
                <div className="form-group"><label htmlFor="new-category">{copy.category}</label><input className="field" id="new-category" name="category" /></div>
                <div className="form-group"><label htmlFor="new-phone">{copy.phone}</label><PhoneInput id="new-phone" name="phone" locale={locale} countryLabel={copy.phoneCountry} defaultCountry={phoneCountryFromLocale(locale)} required /></div>
                <div className="form-group"><label htmlFor="new-email">{copy.emailRequired}</label><input className="field" id="new-email" name="email" type="email" required /></div>
                <div className="form-group full"><label htmlFor="new-role">{copy.accessType}</label><select className="field" id="new-role" name="role" value={newRole} onChange={(event) => setNewRole(event.target.value)}><option value="member">{copy.roleMemberEmail}</option><option value="admin">{copy.roleAdminEmail}</option></select></div>
              </div>
              {error && <div className="form-error">{error}</div>}
              <div className="modal-actions"><button className="button button-ghost" type="button" onClick={closeCreate} disabled={loading}>{copy.cancel}</button><button className="button button-accent" disabled={loading}>{loading ? copy.usersAdding : copy.usersAdd}</button></div>
            </form> : <ExcelUserImport onCancel={closeCreate} onImported={async (result) => { await load(); if (!result.errors.length) { setNotice(`${copy.usersImported} ${result.imported}`); setShowCreate(false); } }} />}
          </section>
        </div>
      )}

      {editingUser && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !busyUserId) setEditingUser(null); }}>
          <section ref={dialogRef} className="modal-card" role="dialog" aria-modal="true" aria-labelledby="edit-user-title" tabIndex={-1}>
            <header className="modal-header"><div><span className="auth-step">{copy.usersProfileEyebrow}</span><h2 id="edit-user-title">{copy.usersEditTitle}</h2></div><button className="modal-close" type="button" onClick={() => setEditingUser(null)} disabled={Boolean(busyUserId)} aria-label={copy.close}>×</button></header>
            <p className="modal-intro">{editIntro}</p>
            <form onSubmit={saveProfile}>
              <div className="form-grid">
                <div className="form-group"><label htmlFor="edit-first-name">{copy.firstName}</label><input className="field" id="edit-first-name" name="firstName" defaultValue={editingUser.firstName} required /></div>
                <div className="form-group"><label htmlFor="edit-last-name">{copy.lastName}</label><input className="field" id="edit-last-name" name="lastName" defaultValue={editingUser.lastName} required /></div>
                <div className="form-group"><label htmlFor="edit-company">{copy.company}</label><input className="field" id="edit-company" name="company" defaultValue={editingUser.company} required /></div>
                <div className="form-group"><label htmlFor="edit-category">{copy.category}</label><input className="field" id="edit-category" name="category" defaultValue={editingUser.category ?? ""} /></div>
                <div className="form-group"><label htmlFor="edit-email">{copy.email}</label><input className="field" id="edit-email" name="email" type="email" defaultValue={editingUser.email ?? ""} required /></div>
                <div className="form-group"><label htmlFor="edit-phone">{copy.phone}</label><PhoneInput id="edit-phone" name="phone" locale={locale} countryLabel={copy.phoneCountry} defaultCountry={phoneCountryFromLocale(locale)} defaultValue={editingUser.phone} required /></div>
                {actorRole === "owner" && editingUser.role !== "owner" && editingUser.id !== actorUserId && <div className="form-group full"><label htmlFor="edit-role">{copy.role}</label><select className="field" id="edit-role" name="role" value={editRole} onChange={(event) => setEditRole(event.target.value as "admin" | "member")}><option value="member">{copy.roleMember}</option><option value="admin">{copy.roleAdmin}</option></select></div>}
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

function formatAdminEmail(email: string | null | undefined, locale: Locale) {
  if (email && !email.endsWith("@migration.invalid")) return email;
  return {
    lv: "E-pasts jānorāda",
    en: "Email required",
    lt: "Reikia el. pašto",
    et: "E-post on nõutud",
  }[locale];
}
