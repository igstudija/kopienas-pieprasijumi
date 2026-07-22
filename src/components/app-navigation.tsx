"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { adminCopy } from "@/lib/admin-i18n";
import { Brand } from "./brand";
import { LanguageSwitcher, useLanguage } from "./language-provider";
import { LogoutButton } from "./logout-button";

export function AppNavigation({ user, showAdmin, logoutRedirect = "/" }: {
  user: { displayName: string; company: string; initials: string };
  showAdmin: boolean;
  logoutRedirect?: string;
}) {
  const { locale, messages } = useLanguage();
  const pathname = usePathname();
  const adminMessages = adminCopy[locale];
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const adminLinks = [
    { href: "/admin", label: adminMessages.usersRegistered, active: pathname === "/admin" },
    { href: "/admin/federation", label: adminMessages.usersPeers, active: pathname.startsWith("/admin/federation") },
    { href: "/admin/whatsapp", label: adminMessages.usersWhatsapp, active: pathname.startsWith("/admin/whatsapp") },
    { href: "/admin/legal", label: adminMessages.legalTitle, active: pathname.startsWith("/admin/legal") },
  ];
  const dashboardTitle = `${messages.dashboardTitleFirst} ${messages.dashboardTitleSecond}`.replace(/\.$/, "");
  const profileTitle = `${messages.profileTitleFirst} ${messages.profileTitleSecond}`.replace(/\.$/, "");
  const newRequestTitle = `${messages.newTitleFirst} ${messages.newTitleSecond}`.replace(/\.$/, "");
  const editRequestTitle = `${messages.editTitleFirst} ${messages.editTitleSecond}`.replace(/\.$/, "");
  const sectionTitle = pathname === "/app" ? dashboardTitle
    : pathname === "/app/profile" ? profileTitle
      : pathname === "/app/new" ? newRequestTitle
        : pathname.startsWith("/app/requests/") ? editRequestTitle
          : pathname === "/admin" ? adminMessages.usersRegistered
            : pathname.startsWith("/admin/federation") ? adminMessages.usersPeers
              : pathname.startsWith("/admin/whatsapp") ? adminMessages.usersWhatsapp
                : pathname.startsWith("/admin/legal") ? adminMessages.legalTitle
                  : messages.navRequests;

  return (
    <>
      <nav className="app-nav">
        <Brand href="/app" markText="SP" label={sectionTitle} />
        <div className="app-nav-links">
          <Link href="/app">{messages.navRequests}</Link>
          {showAdmin && <Link href="/admin">{messages.navAdmin}</Link>}
          <Link href="/app/profile" className="user-chip" aria-label={messages.navProfile}>
            <span className="avatar">{user.initials}</span>
            <span><b>{user.displayName}</b><small>{user.company}</small></span>
          </Link>
          <LogoutButton redirectTo={logoutRedirect} />
        </div>
        <button className="mobile-nav-toggle" type="button" aria-label={open ? messages.closeMenu : messages.openMenu} aria-expanded={open} aria-controls="mobile-navigation" onClick={() => setOpen((current) => !current)}>
          <span /><span /><span />
        </button>
      </nav>
      {open && <button className="mobile-nav-backdrop" type="button" aria-label={messages.closeMenu} onClick={close} />}
      <aside id="mobile-navigation" className={`mobile-nav-drawer ${open ? "open" : ""}`} aria-hidden={!open}>
        <header><span>{messages.menu}</span><button type="button" onClick={close} aria-label={messages.closeMenu}>×</button></header>
        <div className="mobile-nav-links">
          <Link href="/app" onClick={close}>{messages.navRequests}</Link>
          <Link href="/app/profile" onClick={close}>{messages.navProfile}</Link>
          {showAdmin && <div className="mobile-nav-admin-section">
            <span>{messages.navAdmin}</span>
            {adminLinks.map((link) => <Link key={link.href} href={link.href} onClick={close} className={link.active ? "active" : ""} aria-current={link.active ? "page" : undefined}>{link.label}</Link>)}
          </div>}
          <div className="mobile-nav-language"><LanguageSwitcher compact /></div>
        </div>
        <div className="mobile-nav-footer">
          <div className="mobile-nav-person"><span className="avatar">{user.initials}</span><span><b>{user.displayName}</b><small>{user.company}</small></span></div>
          <LogoutButton redirectTo={logoutRedirect} />
        </div>
      </aside>
    </>
  );
}
