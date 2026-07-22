"use client";

import { RequestForm } from "./request-form";
import { useLanguage } from "./language-provider";

export function RequestEditPageClient({ request }: {
  request: {
    id: string;
    title: string;
    details: string;
    target?: string | null;
    industry?: string | null;
    region?: string | null;
    tags: string[];
    visibility: "local" | "selected_peers" | "all_peers";
  };
}) {
  const { messages } = useLanguage();
  return <main className="app-main"><header className="app-heading"><div><span className="auth-step">{messages.editEntry}</span><h1>{messages.editTitleFirst}<br />{messages.editTitleSecond}</h1></div><p>{messages.editIntro}</p></header><RequestForm request={request} /></main>;
}
