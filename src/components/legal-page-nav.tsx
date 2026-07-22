"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { AppHeader } from "./app-header";
import { AppNavigation } from "./app-navigation";
import { LanguageSwitcher, useLanguage } from "./language-provider";
import { legalCopy } from "@/lib/legal-copy";

type LegalPageUser = { displayName: string; company: string; initials: string; showAdmin: boolean };

export function LegalPageNav({ user }: { user?: LegalPageUser }) {
  const { locale, messages } = useLanguage();
  const pathname = usePathname();
  const copy = legalCopy[locale];
  const title = pathname.startsWith("/privacy") ? copy.privacy.eyebrow : copy.impressum.title.replace(/\.$/, "");
  if (user) return <AppNavigation user={user} showAdmin={user.showAdmin} />;

  return <AppHeader title={title} drawerId="legal-mobile-navigation">{(closeMenu) =>
      <div className="mobile-nav-links">
        <Link href="/app" onClick={closeMenu}>{copy.back}</Link>
        <Link href="/par-risinajumu" onClick={closeMenu}>{messages.impressum}</Link>
        <Link href="/privacy" onClick={closeMenu}>{messages.privacy}</Link>
        <div className="mobile-nav-language"><LanguageSwitcher compact /></div>
      </div>
  }</AppHeader>;
}
