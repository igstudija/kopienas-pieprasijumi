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
  return <main className="app-main"><p className="app-page-intro">{messages.editIntro}</p><RequestForm request={request} /></main>;
}
