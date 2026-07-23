"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { jsonRequest, fetchJson } from "@/lib/client-api";
import { ArrowIcon } from "./icons";
import { useLanguage } from "./language-provider";

type EditableRequest = {
  id: string;
  title: string;
  details: string;
  target?: string | null;
  industry?: string | null;
  region?: string | null;
  tags: string[];
  visibility: "local" | "selected_peers" | "all_peers";
};

export function RequestForm({ request, onSaved, onCancel }: {
  request?: EditableRequest;
  onSaved?: () => void | Promise<void>;
  onCancel?: () => void;
}) {
  const { messages } = useLanguage();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const data = new FormData(event.currentTarget);
    const body = {
      title: data.get("title"),
      details: data.get("details"),
      target: data.get("target") || null,
      industry: data.get("industry") || null,
      region: data.get("region") || null,
      tags: String(data.get("tags") ?? "").split(",").map((tag) => tag.trim()).filter(Boolean),
      visibility: data.get("visibility"),
    };

    try {
      const url = request ? `/api/v1/requests/${request.id}` : "/api/v1/requests";
      await fetchJson(url, jsonRequest(request ? "PATCH" : "POST", body));
      if (onSaved) await onSaved();
      else {
        router.push("/");
        router.refresh();
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Neizdevās saglabāt.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="form-card" onSubmit={submit}>
      <div className="form-grid">
        <div className="form-group full">
          <label htmlFor="title">{messages.whatLookingFor}</label>
          <input className="field" id="title" name="title" required minLength={4} maxLength={180} placeholder={messages.whatPlaceholder} defaultValue={request?.title} autoFocus={Boolean(onSaved)} />
        </div>
        <div className="form-group full">
          <label htmlFor="details">{messages.contextResult}</label>
          <textarea className="field" id="details" name="details" required minLength={10} maxLength={4000} placeholder={messages.contextPlaceholder} defaultValue={request?.details} />
        </div>
        <div className="form-group">
          <label htmlFor="target">{messages.target}</label>
          <input className="field" id="target" name="target" maxLength={240} placeholder={messages.optional} defaultValue={request?.target ?? ""} />
        </div>
        <div className="form-group">
          <label htmlFor="industry">{messages.industry}</label>
          <input className="field" id="industry" name="industry" maxLength={160} placeholder={messages.industryPlaceholder} defaultValue={request?.industry ?? ""} />
        </div>
        <div className="form-group">
          <label htmlFor="region">{messages.region}</label>
          <input className="field" id="region" name="region" maxLength={160} placeholder={messages.regionPlaceholder} defaultValue={request?.region ?? ""} />
        </div>
        <div className="form-group">
          <label htmlFor="tags">{messages.tags}</label>
          <input className="field" id="tags" name="tags" placeholder={messages.tagsPlaceholder} defaultValue={request?.tags.join(", ") ?? ""} />
        </div>
        <div className="form-group full">
          <label htmlFor="visibility">{messages.visibility}</label>
          <select className="field" id="visibility" name="visibility" defaultValue={request?.visibility === "all_peers" ? "all_peers" : "local"}>
            <option value="local">{messages.localOnly}</option>
            <option value="all_peers">{messages.allPeers}</option>
          </select>
        </div>
      </div>
      {error && <div className="form-error" role="alert">{error}</div>}
      <div className="form-actions">
        <button className="button button-accent" disabled={loading}>
          {loading ? messages.saving : <>{request ? messages.saveRequest : messages.publishRequest} <ArrowIcon /></>}
        </button>
        {onCancel
          ? <button className="button button-ghost" type="button" onClick={onCancel} disabled={loading}>{messages.cancel}</button>
          : <Link className="button button-ghost" href="/">{messages.cancel}</Link>}
      </div>
    </form>
  );
}
