"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLanguage } from "./language-provider";

export function LogoutButton({ redirectTo = "/" }: { redirectTo?: string }) {
  const router = useRouter();
  const { messages } = useLanguage();
  const [loading, setLoading] = useState(false);
  return <button className="button button-ghost button-small" disabled={loading} onClick={async () => { setLoading(true); await fetch("/api/v1/auth/logout", { method: "POST" }); router.push(redirectTo); router.refresh(); }}>{loading ? "…" : messages.logout}</button>;
}
