"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLanguage } from "./language-provider";
import { LogoutIcon } from "./icons";
import { fetchJson } from "@/lib/client-api";

export function LogoutButton({ redirectTo = "/", iconOnly = false }: { redirectTo?: string; iconOnly?: boolean }) {
  const router = useRouter();
  const { messages } = useLanguage();
  const [loading, setLoading] = useState(false);
  return <button className={iconOnly ? "row-action icon-action" : "button button-ghost button-small"} aria-label={iconOnly ? messages.logout : undefined} title={iconOnly ? messages.logout : undefined} disabled={loading} onClick={async () => { setLoading(true); try { await fetchJson("/api/v1/auth/logout", { method: "POST" }); router.push(redirectTo); router.refresh(); } catch { setLoading(false); } }}>{loading ? "…" : iconOnly ? <LogoutIcon /> : messages.logout}</button>;
}
