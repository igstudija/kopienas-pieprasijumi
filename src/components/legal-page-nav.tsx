"use client";

import Link from "next/link";
import { Brand } from "./brand";
import { LanguageSwitcher, useLanguage } from "./language-provider";
import { legalCopy } from "@/lib/legal-copy";

export function LegalPageNav() {
  const { locale } = useLanguage();
  return <nav className="legal-page-nav"><Brand /><div><Link href="/">{legalCopy[locale].back}</Link><LanguageSwitcher /></div></nav>;
}
