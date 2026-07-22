"use client";

import Link from "next/link";
import { useLanguage } from "./language-provider";

export function Brand({ compact = false, href = "/", label, markText }: { compact?: boolean; href?: string; label?: string; markText?: string }) {
  const { messages } = useLanguage();
  return (
    <Link href={href} className="brand" aria-label={messages.brandAria}>
      <span className={`brand-mark ${markText ? "brand-mark-text" : ""}`} aria-hidden="true">{markText ?? <><i /><i /><i /></>}</span>
      {!compact && <span>{label ? <strong>{label}</strong> : <>{messages.brandFirst} <strong>{messages.brandSecond}</strong></>}</span>}
    </Link>
  );
}
