"use client";

import Link from "next/link";
import { useLanguage } from "./language-provider";

export function Brand({ compact = false }: { compact?: boolean }) {
  const { messages } = useLanguage();
  return (
    <Link href="/" className="brand" aria-label={messages.brandAria}>
      <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
      {!compact && <span>{messages.brandFirst}<br /><strong>{messages.brandSecond}</strong></span>}
    </Link>
  );
}
