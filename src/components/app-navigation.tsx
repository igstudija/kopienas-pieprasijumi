"use client";

import Link from "next/link";
import { useState } from "react";
import { Brand } from "./brand";
import { LanguageSwitcher, useLanguage } from "./language-provider";
import { LogoutButton } from "./logout-button";

export function AppNavigation({ user, showAdmin, logoutRedirect = "/" }: {
  user: { displayName: string; company: string; initials: string };
  showAdmin: boolean;
  logoutRedirect?: string;
}) {
  const { messages } = useLanguage();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      <nav className="app-nav">
        <Brand />
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
        <div className="mobile-nav-person"><span className="avatar">{user.initials}</span><span><b>{user.displayName}</b><small>{user.company}</small></span></div>
        <div className="mobile-nav-links">
          <Link href="/app" onClick={close}>{messages.navRequests}</Link>
          <Link href="/app/profile" onClick={close}>{messages.navProfile}</Link>
          {showAdmin && <Link href="/admin" onClick={close}>{messages.navAdmin}</Link>}
        </div>
        <div className="mobile-nav-footer"><LanguageSwitcher compact /><LogoutButton redirectTo={logoutRedirect} /></div>
      </aside>
    </>
  );
}
