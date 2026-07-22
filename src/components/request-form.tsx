"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowIcon } from "./icons";

export function RequestForm() {
  const router = useRouter(); const [loading, setLoading] = useState(false); const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError("");
    const data = new FormData(event.currentTarget);
    const body = { title: data.get("title"), details: data.get("details"), target: data.get("target") || null, industry: data.get("industry") || null, region: data.get("region") || null, tags: String(data.get("tags") ?? "").split(",").map((tag) => tag.trim()).filter(Boolean), visibility: data.get("visibility") };
    try { const response = await fetch("/api/v1/requests", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }); const result = await response.json(); if (!response.ok) throw new Error(result.error); router.push("/app"); router.refresh(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Neizdevās saglabāt."); }
    finally { setLoading(false); }
  }
  return <form className="form-card" onSubmit={submit}><div className="form-grid"><div className="form-group full"><label htmlFor="title">Ko tieši tu meklē?</label><input className="field" id="title" name="title" required minLength={4} maxLength={180} placeholder="Piemēram: kontakts ražošanas uzņēmuma vadībā" /></div><div className="form-group full"><label htmlFor="details">Konteksts un vēlamais rezultāts</label><textarea className="field" id="details" name="details" required minLength={10} maxLength={4000} placeholder="Apraksti, ar kādu cilvēku vai uzņēmumu vēlies iepazīties un kāpēc…" /></div><div className="form-group"><label htmlFor="target">Mērķa uzņēmums vai persona</label><input className="field" id="target" name="target" maxLength={240} placeholder="Neobligāti" /></div><div className="form-group"><label htmlFor="industry">Nozare</label><input className="field" id="industry" name="industry" maxLength={160} placeholder="Piemēram: ražošana" /></div><div className="form-group"><label htmlFor="region">Reģions</label><input className="field" id="region" name="region" maxLength={160} placeholder="Piemēram: Rīga, Baltija" /></div><div className="form-group"><label htmlFor="tags">Atslēgvārdi</label><input className="field" id="tags" name="tags" placeholder="B2B, eksports, vadība" /></div><div className="form-group full"><label htmlFor="visibility">Kas to redzēs?</label><select className="field" id="visibility" name="visibility" defaultValue="local"><option value="local">Tikai mana lokālā grupa</option><option value="all_peers">Lokālā un visas savienotās grupas</option></select></div></div>{error && <div className="form-error">{error}</div>}<div className="form-actions"><button className="button button-accent" disabled={loading}>{loading ? "Saglabājam…" : <>Publicēt pieprasījumu <ArrowIcon /></>}</button><Link className="button button-ghost" href="/app">Atcelt</Link></div></form>;
}
