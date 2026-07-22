"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { adminCopy } from "@/lib/admin-i18n";
import { useLanguage } from "./language-provider";

export function AdminSectionNav() {
  const pathname = usePathname();
  const { locale } = useLanguage();
  const copy = adminCopy[locale];
  const links = [
    { href: "/admin", label: copy.usersRegistered, active: pathname === "/admin" },
    { href: "/admin/federation", label: copy.usersPeers, active: pathname.startsWith("/admin/federation") },
    { href: "/admin/whatsapp", label: copy.usersWhatsapp, active: pathname.startsWith("/admin/whatsapp") },
  ];

  return (
    <nav className="admin-section-nav" aria-label={copy.usersEyebrow}>
      <div>
        {links.map((link) => <Link key={link.href} href={link.href} className={link.active ? "active" : ""} aria-current={link.active ? "page" : undefined}>{link.label}</Link>)}
      </div>
    </nav>
  );
}
