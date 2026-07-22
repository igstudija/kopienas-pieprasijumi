"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchJson, isAbortError } from "@/lib/client-api";
import { useModalDialog } from "@/lib/use-modal-dialog";
import { ChevronDownIcon, EditIcon, GlobeIcon, PlusIcon, TrashIcon } from "./icons";
import { useLanguage } from "./language-provider";
import { RequestForm } from "./request-form";

type RequestItem = {
  id: string; authorId: string; authorName: string; authorCompany: string; authorCategory?: string | null;
  title: string; details: string; target?: string | null; industry?: string | null; region?: string | null;
  tags: string[]; updatedAt: string; createdAt: string; origin: "local" | "remote"; peerName: string | null;
  sourceId: string; sourceName: string; visibility: "local" | "selected_peers" | "all_peers";
};
type RequestGroup = { authorId: string; authorName: string; authorCompany: string; authorCategory?: string | null; lastActivityAt: string; requests: RequestItem[] };
type Period = "all" | "week" | "month";
type RequestsResponse = { groups: RequestGroup[]; currentUserId: string };

export function DashboardClient() {
  const { locale, messages } = useLanguage();
  const [groups, setGroups] = useState<RequestGroup[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [period, setPeriod] = useState<Period>("all");
  const [deletingId, setDeletingId] = useState("");
  const [visibleGroups, setVisibleGroups] = useState(8);
  const [showCreate, setShowCreate] = useState(false);
  const [editingRequest, setEditingRequest] = useState<RequestItem | null>(null);

  const loadRequests = useCallback(async (signal?: AbortSignal) => {
    const data = await fetchJson<RequestsResponse>("/api/v1/requests", { signal });
    setGroups(data.groups);
    setCurrentUserId(data.currentUserId);
  }, []);

  const dialogRef = useModalDialog<HTMLElement>(Boolean(showCreate || editingRequest), () => {
    setShowCreate(false);
    setEditingRequest(null);
  });

  useEffect(() => {
    const controller = new AbortController();
    fetchJson<RequestsResponse>("/api/v1/requests", { signal: controller.signal })
      .then((data) => {
        setGroups(data.groups);
        setCurrentUserId(data.currentUserId);
      })
      .catch((cause: unknown) => {
        if (!isAbortError(cause)) setError(cause instanceof Error ? cause.message : "Neizdevās ielādēt.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => {
      controller.abort();
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    let previousY = Math.max(0, window.scrollY);
    let frame = 0;

    function updateChrome() {
      const currentY = Math.max(0, window.scrollY);
      if (currentY <= 24 || currentY < previousY) root.classList.remove("request-chrome-hidden");
      else if (currentY > 120 && currentY > previousY) root.classList.add("request-chrome-hidden");
      previousY = currentY;
      frame = 0;
    }

    function handleScroll() {
      if (!frame) frame = window.requestAnimationFrame(updateChrome);
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (frame) window.cancelAnimationFrame(frame);
      root.classList.remove("request-chrome-hidden");
    };
  }, []);

  const sources = useMemo(() => {
    const values = new Map<string, string>();
    for (const group of groups) for (const item of group.requests) if (item.origin === "remote") values.set(item.sourceId, item.sourceName);
    return [...values.entries()].map(([id, name]) => ({ id, name }));
  }, [groups]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase(locale);
    const boundary = periodBoundary(period);
    return groups.map((group) => ({
      ...group,
      requests: group.requests.filter((item) => {
        if (selectedSources.length && !selectedSources.includes(item.sourceId)) return false;
        if (boundary && new Date(item.createdAt) < boundary) return false;
        if (!needle) return true;
        return [item.title, item.details, item.authorName, item.authorCompany, item.authorCategory, item.target, item.industry, item.region, ...item.tags].filter(Boolean).join(" ").toLocaleLowerCase(locale).includes(needle);
      }),
    })).filter((group) => group.requests.length);
  }, [groups, locale, period, query, selectedSources]);

  const requestCount = filtered.reduce((total, group) => total + group.requests.length, 0);
  const visible = filtered.slice(0, visibleGroups);

  async function deleteRequest(item: RequestItem) {
    if (!window.confirm(messages.deleteConfirm.replace("{title}", item.title))) return;
    setDeletingId(item.id);
    setError("");
    try {
      await fetchJson(`/api/v1/requests/${item.id}`, { method: "DELETE" });
      setGroups((current) => current.map((group) => ({ ...group, requests: group.requests.filter((requestItem) => requestItem.id !== item.id) })).filter((group) => group.requests.length));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Pieprasījumu neizdevās dzēst.");
    } finally {
      setDeletingId("");
    }
  }

  return (
    <main className="request-dashboard">
      <div className="dashboard-filter-bar">
        <div className="dashboard-filters">
          <input className="search-input" type="search" placeholder={messages.searchRequests} value={query} onChange={(event) => { setQuery(event.target.value); setVisibleGroups(8); }} aria-label={messages.searchRequests} />
          <FilterRow className="group-filter-row" label={messages.filterGroup}><FilterButton active={!selectedSources.length} onClick={() => { setSelectedSources([]); setVisibleGroups(8); }}>{messages.filterAll}</FilterButton>{sources.map((item) => <FilterButton key={item.id} active={selectedSources.includes(item.id)} onClick={() => { setSelectedSources((current) => current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id]); setVisibleGroups(8); }}>{item.name}</FilterButton>)}</FilterRow>
          <div className="mobile-select-filter mobile-group-filter">
            <b>{messages.filterGroup}</b>
            <details>
              <summary><span>{selectedSources.length ? selectedSources.map((id) => sources.find((item) => item.id === id)?.name).filter(Boolean).join(", ") : messages.filterAll}</span><ChevronDownIcon /></summary>
              <div className="mobile-filter-options">
                <button type="button" className={!selectedSources.length ? "active" : ""} aria-pressed={!selectedSources.length} onClick={() => { setSelectedSources([]); setVisibleGroups(8); }}><i aria-hidden="true">{!selectedSources.length ? "✓" : ""}</i>{messages.filterAll}</button>
                {sources.map((item) => <button type="button" key={item.id} className={selectedSources.includes(item.id) ? "active" : ""} aria-pressed={selectedSources.includes(item.id)} onClick={() => { setSelectedSources((current) => current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id]); setVisibleGroups(8); }}><i aria-hidden="true">{selectedSources.includes(item.id) ? "✓" : ""}</i>{item.name}</button>)}
              </div>
            </details>
          </div>
          <FilterRow className="period-filter-row" label={messages.filterPeriod}><FilterButton active={period === "all"} onClick={() => { setPeriod("all"); setVisibleGroups(8); }}>{messages.filterAll}</FilterButton><FilterButton active={period === "week"} onClick={() => { setPeriod("week"); setVisibleGroups(8); }}>{messages.filterWeek}</FilterButton><FilterButton active={period === "month"} onClick={() => { setPeriod("month"); setVisibleGroups(8); }}>{messages.filterMonth}</FilterButton></FilterRow>
          <div className="mobile-select-filter mobile-period-filter">
            <b>{messages.filterPeriod}</b>
            <details>
              <summary><span>{period === "all" ? messages.filterAll : period === "week" ? messages.filterWeek : messages.filterMonth}</span><ChevronDownIcon /></summary>
              <div className="mobile-filter-options">
                <MobilePeriodOption active={period === "all"} onClick={() => { setPeriod("all"); setVisibleGroups(8); }}>{messages.filterAll}</MobilePeriodOption>
                <MobilePeriodOption active={period === "week"} onClick={() => { setPeriod("week"); setVisibleGroups(8); }}>{messages.filterWeek}</MobilePeriodOption>
                <MobilePeriodOption active={period === "month"} onClick={() => { setPeriod("month"); setVisibleGroups(8); }}>{messages.filterMonth}</MobilePeriodOption>
              </div>
            </details>
          </div>
        </div>
      </div>
      <div className="app-main request-dashboard-content">
        {error && <div className="form-error">{error}</div>}
        {loading ? <div className="loading-state"><div className="skeleton"/><div className="skeleton"/></div> : filtered.length ? (
          <><p className="request-summary">{filtered.length} {filtered.length === 1 ? messages.memberOne : messages.memberMany} · {requestCount} {requestCount === 1 ? messages.requestOne : messages.requestMany}</p><div className="member-groups">{visible.map((group) => <MemberGroup key={group.authorId} group={group} currentUserId={currentUserId} deletingId={deletingId} onDelete={deleteRequest} onEdit={setEditingRequest} locale={locale} />)}</div>{visibleGroups < filtered.length && <div className="load-more-row"><button className="button button-ghost" type="button" onClick={() => setVisibleGroups((count) => count + 8)}>{messages.loadMore}</button></div>}</>
        ) : <div className="empty-state"><h2>{messages.noResults}</h2><p>{messages.noResultsText}</p><button type="button" className="button button-accent" onClick={() => setShowCreate(true)}><PlusIcon /> {messages.createRequest}</button></div>}
      </div>
      <button type="button" className="floating-add-button" aria-label={messages.newRequest} title={messages.newRequest} onClick={() => setShowCreate(true)}><PlusIcon /></button>
      {showCreate && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowCreate(false); }}>
        <section ref={dialogRef} className="modal-card request-create-modal" role="dialog" aria-modal="true" aria-labelledby="create-request-title" tabIndex={-1}>
          <header className="modal-header"><div><span className="auth-step">{messages.newEntry}</span><h2 id="create-request-title">{messages.newRequest}</h2></div><button className="modal-close" type="button" aria-label={messages.cancel} onClick={() => setShowCreate(false)}>×</button></header>
          <p className="modal-intro">{messages.newIntro}</p>
          <RequestForm onCancel={() => setShowCreate(false)} onSaved={async () => { await loadRequests(); setShowCreate(false); }} />
        </section>
      </div>}
      {editingRequest && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setEditingRequest(null); }}>
        <section ref={dialogRef} className="modal-card request-create-modal" role="dialog" aria-modal="true" aria-labelledby="edit-request-title" tabIndex={-1}>
          <header className="modal-header"><div><span className="auth-step">{messages.editEntry}</span><h2 id="edit-request-title">{messages.editRequest}</h2></div><button className="modal-close" type="button" aria-label={messages.cancel} onClick={() => setEditingRequest(null)}>×</button></header>
          <p className="modal-intro">{messages.editIntro}</p>
          <RequestForm key={editingRequest.id} request={editingRequest} onCancel={() => setEditingRequest(null)} onSaved={async () => { await loadRequests(); setEditingRequest(null); }} />
        </section>
      </div>}
    </main>
  );
}

function FilterRow({ className = "", label, children }: { className?: string; label: string; children: React.ReactNode }) {
  return <div className={`filter-row ${className}`}><b>{label}</b><div>{children}</div></div>;
}

function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" className={active ? "active" : ""} aria-pressed={active} onClick={onClick}>{children}</button>;
}

function MobilePeriodOption({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" className={active ? "active" : ""} aria-pressed={active} onClick={(event) => { onClick(); event.currentTarget.closest("details")?.removeAttribute("open"); }}><i aria-hidden="true">{active ? "✓" : ""}</i>{children}</button>;
}

function MemberGroup({ group, currentUserId, deletingId, onDelete, onEdit, locale }: { group: RequestGroup; currentUserId: string; deletingId: string; onDelete: (item: RequestItem) => void; onEdit: (item: RequestItem) => void; locale: "lv" | "en" | "lt" | "et" }) {
  const { messages } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const latest = group.requests[0];
  const canExpand = group.requests.length > 1;
  const initials = group.authorName.split(" ").map((part) => part[0]).slice(0, 2).join("");
  return (
    <section className={`member-group request-member-card ${expanded ? "expanded" : ""}`}>
      <div className="member-summary-row">
        <div className="member-identity"><span className="avatar">{initials}</span><div className="member-meta"><strong>{group.authorName}</strong><span>{group.authorCompany}</span>{group.authorCategory && <small>{group.authorCategory}</small>}</div></div>
        <article className="latest-request-preview">
          <RequestTop item={latest} canManage={latest.origin === "local" && latest.authorId === currentUserId} deleting={deletingId === latest.id} onDelete={onDelete} onEdit={onEdit} />
          <h2>{latest.title}</h2><p>{latest.details}</p><small>{messages.added} {formatDateTime(latest.createdAt, locale)}{latest.updatedAt !== latest.createdAt ? ` · ${messages.updated} ${formatDateTime(latest.updatedAt, locale)}` : ""}</small>
        </article>
        {canExpand ? <button className="request-count-panel" type="button" aria-expanded={expanded} onClick={() => setExpanded((current) => !current)}><b>{group.requests.length}</b><span>{messages.requestMany}</span><i aria-hidden="true">{expanded ? "⌃" : "⌄"}</i></button> : <div className="request-count-panel single"><b>1</b><span>{messages.requestOne}</span></div>}
      </div>
      {expanded && canExpand && <div className="member-expanded-requests"><div className="expanded-request-list">{group.requests.map((item) => <ExpandedRequest item={item} key={item.id} canManage={item.origin === "local" && item.authorId === currentUserId} deleting={deletingId === item.id} onDelete={onDelete} onEdit={onEdit} locale={locale} />)}</div></div>}
    </section>
  );
}

function RequestTop({ item, canManage, deleting, onDelete, onEdit }: { item: RequestItem; canManage: boolean; deleting: boolean; onDelete: (item: RequestItem) => void; onEdit: (item: RequestItem) => void }) {
  const { messages } = useLanguage();
  return <div className="request-card-top">{item.origin === "remote" && <span className="origin-badge"><GlobeIcon />{item.sourceName}</span>}{canManage && <div className="request-inline-actions"><button className="row-action icon-action" type="button" onClick={() => onEdit(item)} aria-label={messages.editRequest} title={messages.editRequest}><EditIcon /></button><button className="row-action row-action-danger icon-action" type="button" disabled={deleting} onClick={() => onDelete(item)} aria-label={deleting ? messages.deletingRequest : messages.deleteRequest} title={deleting ? messages.deletingRequest : messages.deleteRequest}><TrashIcon /></button></div>}</div>;
}

function ExpandedRequest({ item, canManage, deleting, onDelete, onEdit, locale }: { item: RequestItem; canManage: boolean; deleting: boolean; onDelete: (item: RequestItem) => void; onEdit: (item: RequestItem) => void; locale: "lv" | "en" | "lt" | "et" }) {
  const tags = [item.target, item.industry, item.region, ...item.tags].filter((tag): tag is string => Boolean(tag));
  return <article className="expanded-request-item"><div className="expanded-request-heading"><RequestTop item={item} canManage={canManage} deleting={deleting} onDelete={onDelete} onEdit={onEdit} /><small>{formatDateTime(item.updatedAt, locale)}</small></div><h2>{item.title}</h2><p>{item.details}</p>{tags.length > 0 && <div className="tag-row">{tags.map((tag, index) => <span key={`${tag}-${index}`}>{tag}</span>)}</div>}</article>;
}

function periodBoundary(period: Period) {
  if (period === "all") return null;
  const now = new Date();
  if (period === "month") return new Date(now.getFullYear(), now.getMonth(), 1);
  const boundary = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekday = boundary.getDay() || 7;
  boundary.setDate(boundary.getDate() - weekday + 1);
  return boundary;
}

function formatDateTime(value: string, locale: "lv" | "en" | "lt" | "et") {
  const localeName = { lv: "lv-LV", en: "en-GB", lt: "lt-LT", et: "et-EE" }[locale];
  return new Intl.DateTimeFormat(localeName, { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}
