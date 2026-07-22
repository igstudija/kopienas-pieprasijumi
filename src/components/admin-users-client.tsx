"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

type AdminUser = {
  id: string;
  displayName: string;
  company: string;
  category?: string | null;
  phoneLast4: string;
  role: string;
  status: string;
  lastLoginAt?: string | null;
};

export function AdminUsersClient() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [newRole, setNewRole] = useState("member");

  async function load() {
    const response = await fetch("/api/v1/admin/users");
    const data = await response.json();
    if (response.ok) setUsers(data.users);
    else setError(data.error);
  }

  useEffect(() => {
    let active = true;
    fetch("/api/v1/admin/users")
      .then(async (response) => ({ response, data: await response.json() }))
      .then(({ response, data }) => {
        if (!active) return;
        if (response.ok) setUsers(data.users);
        else setError(data.error);
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
    const form = event.currentTarget;
    const body = Object.fromEntries(new FormData(form).entries());
    const response = await fetch("/api/v1/admin/users", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) setError(data.error);
    else {
      form.reset();
      setNewRole("member");
      await load();
    }
    setLoading(false);
  }

  return (
    <main className="app-main">
      <header className="app-heading">
        <div><span className="auth-step">Instances administrācija</span><h1>Biedri un<br />piekļuves.</h1></div>
        <Link className="button button-dark" href="/admin/federation">Savienotās grupas</Link>
      </header>
      {error && <div className="form-error">{error}</div>}
      <div className="admin-grid">
        <section className="data-card">
          <h2>Reģistrētie biedri</h2>
          {users.map((user) => (
            <div className="user-row" key={user.id}>
              <div><strong>{user.displayName}</strong><small>{user.company} · •••• {user.phoneLast4}</small></div>
              <div><small>{user.category ?? "Nav kategorijas"}</small></div>
              <span className={`status-pill ${user.status}`}>{user.role} · {user.status}</span>
            </div>
          ))}
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
