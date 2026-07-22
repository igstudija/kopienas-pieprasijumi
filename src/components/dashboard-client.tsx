"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { GlobeIcon, PlusIcon } from "./icons";

type RequestItem = {
  id: string; authorId: string; authorName: string; authorCompany: string; authorCategory?: string | null;
  title: string; details: string; target?: string | null; industry?: string | null; region?: string | null;
  tags: string[]; updatedAt: string; createdAt: string; origin: "local" | "remote"; peerName: string | null;
};
type RequestGroup = { authorId: string; authorName: string; authorCompany: string; authorCategory?: string | null; lastActivityAt: string; requests: RequestItem[] };

export function DashboardClient() {
  const [groups, setGroups] = useState<RequestGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/v1/requests")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        if (active) setGroups(data.groups);
      })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : "Neizdevās ielādēt."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("lv");
    if (!needle) return groups;
    return groups.map((group) => ({ ...group, requests: group.requests.filter((item) => [item.title, item.details, item.authorName, item.authorCompany, ...item.tags].join(" ").toLocaleLowerCase("lv").includes(needle)) })).filter((group) => group.requests.length);
  }, [groups, query]);

  return <main className="app-main"><header className="app-heading"><div><span className="auth-step">Kopienas aktuālais</span><h1>Ko mēs<br />šobrīd meklējam?</h1></div><Link href="/app/new" className="button button-accent"><PlusIcon /> Jauns pieprasījums</Link></header><div className="dashboard-toolbar"><input className="search-input" type="search" placeholder="Meklēt pēc cilvēka, uzņēmuma vai tēmas…" value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Meklēt pieprasījumos" /></div>{error && <div className="form-error">{error}</div>}{loading ? <div className="loading-state"><div className="skeleton"/><div className="skeleton"/></div> : filtered.length ? <div className="member-groups">{filtered.map((group) => <MemberGroup key={group.authorId} group={group} />)}</div> : <div className="empty-state"><h2>Vēl nav aktīvu pieprasījumu.</h2><p>Esi pirmais, kurš skaidri pasaka, ko šobrīd meklē.</p><Link href="/app/new" className="button button-accent"><PlusIcon /> Izveidot pieprasījumu</Link></div>}</main>;
}

function MemberGroup({ group }: { group: RequestGroup }) {
  const initials = group.authorName.split(" ").map((part) => part[0]).slice(0, 2).join("");
  return <section className="member-group"><header className="member-header"><span className="avatar">{initials}</span><div className="member-meta"><strong>{group.authorName}</strong><small>{[group.authorCompany, group.authorCategory].filter(Boolean).join(" · ")}</small></div><div className="member-activity"><b>{group.requests.length} {group.requests.length === 1 ? "pieprasījums" : "pieprasījumi"}</b><span>Atjaunots {formatRelative(group.lastActivityAt)}</span></div></header><div className="request-list">{group.requests.map((item) => <article className="request-item" key={item.id}><div><span className="origin-badge">{item.origin === "remote" && <GlobeIcon />}{item.origin === "remote" ? item.peerName : "Lokālā grupa"}</span><h2>{item.title}</h2><p>{item.details}</p><div className="tag-row">{[item.target, item.industry, item.region, ...item.tags].filter(Boolean).map((tag) => <span key={tag}>{tag}</span>)}</div></div><div className="request-side"><span className="status-pill active">Aktīvs</span></div></article>)}</div></section>;
}

function formatRelative(value: string) {
  const date = new Date(value); const diff = Date.now() - date.getTime();
  if (diff < 60_000) return "tikko";
  if (diff < 3_600_000) return `pirms ${Math.floor(diff / 60_000)} min`;
  if (diff < 86_400_000) return `pirms ${Math.floor(diff / 3_600_000)} h`;
  return new Intl.DateTimeFormat("lv-LV", { day: "numeric", month: "short" }).format(date);
}
