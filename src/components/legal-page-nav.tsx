"use client";

import { usePathname } from "next/navigation";
import { Brand } from "./brand";
import { LanguageSwitcher, useLanguage } from "./language-provider";
import { legalCopy } from "@/lib/legal-copy";

export function LegalPageNav() {
  const { locale } = useLanguage();
  const pathname = usePathname();
  const copy = legalCopy[locale];
  const title = pathname.startsWith("/privacy") ? copy.privacy.eyebrow : copy.impressum.title.replace(/\.$/, "");
  return <nav className="legal-page-nav"><Brand href="/app" markText="SP" label={title} /><div><LanguageSwitcher /></div></nav>;
}
