"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  return <button className="button button-ghost button-small" disabled={loading} onClick={async () => { setLoading(true); await fetch("/api/v1/auth/logout", { method: "POST" }); router.push("/login"); router.refresh(); }}>{loading ? "…" : "Iziet"}</button>;
}
