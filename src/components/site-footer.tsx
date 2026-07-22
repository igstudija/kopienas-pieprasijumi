"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LanguageSwitcher, useLanguage } from "./language-provider";

export function SiteFooter() {
  const { messages } = useLanguage();
  const pathname = usePathname();
  return (
    <footer className={`site-footer ${pathname.startsWith("/app") ? "mobile-language-in-menu" : ""}`}>
      <div className="site-footer-credit">
        <span>{messages.footerCredit}</span>
        <a href="https://codars.com" target="_blank" rel="noreferrer">codars.com</a>
      </div>
      <nav aria-label="Legal">
        <Link href="/impressum">{messages.impressum}</Link>
        <Link href="/privacy">{messages.privacy}</Link>
        <button className="footer-text-button" type="button" onClick={() => window.dispatchEvent(new Event("community:open-cookie-settings"))}>{messages.cookieSettings}</button>
        <LanguageSwitcher compact />
      </nav>
    </footer>
  );
}
