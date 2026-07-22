"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useLanguage } from "./language-provider";

export function Brand({ compact = false, href = "/", label, markIcon }: { compact?: boolean; href?: string; label?: string; markIcon?: ReactNode }) {
  const { messages } = useLanguage();
  return (
    <Link href={href} className="brand" aria-label={messages.brandAria}>
      <span className={`brand-mark ${markIcon ? "brand-mark-icon" : ""}`} aria-hidden="true">{markIcon ?? <><i /><i /><i /></>}</span>
      {!compact && <span>{label ? <strong>{label}</strong> : <>{messages.brandFirst} <strong>{messages.brandSecond}</strong></>}</span>}
    </Link>
  );
}
