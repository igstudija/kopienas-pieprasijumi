"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { adminCopy } from "@/lib/admin-i18n";
import { legalCopy } from "@/lib/legal-copy";
import { AppHeader } from "./app-header";
import { EditIcon } from "./icons";
import { useLanguage } from "./language-provider";
import { LogoutButton } from "./logout-button";

type NavigationUser = { displayName: string; company: string; initials: string };

export function AppNavigation({ user, showAdmin = false, logoutRedirect = "/", title, installationMode = false }: {
  user?: NavigationUser;
  showAdmin?: boolean;
  logoutRedirect?: string;
  title?: string;
  installationMode?: boolean;
}) {
  const { locale, messages } = useLanguage();
  const pathname = usePathname();
  const adminMessages = adminCopy[locale];
  const adminLinks = [
    { href: "/admin", label: adminMessages.usersRegistered, active: pathname === "/admin" },
    { href: "/admin/federation", label: adminMessages.usersPeers, active: pathname.startsWith("/admin/federation") },
    { href: "/admin/email", label: adminMessages.usersEmail, active: pathname.startsWith("/admin/email") },
    { href: "/admin/legal", label: adminMessages.legalTitle, active: pathname.startsWith("/admin/legal") },
    { href: "/admin/settings", label: adminMessages.usersSettings, active: pathname.startsWith("/admin/settings") },
    { href: "/help", label: adminMessages.usersHelp, active: pathname === "/help" },
  ];
  const informationLinks = installationMode
    ? [
        { href: "/setup", label: "Installation setup", active: pathname === "/setup" },
        { href: "/help/install", label: "Installation help", active: pathname.startsWith("/help/install") },
      ]
    : [
        { href: "/par-risinajumu", label: messages.impressum, active: pathname.startsWith("/par-risinajumu") },
        { href: "/privacy", label: messages.privacy, active: pathname.startsWith("/privacy") },
      ];
  const dashboardTitle = `${messages.dashboardTitleFirst} ${messages.dashboardTitleSecond}`.replace(/\.$/, "");
  const profileTitle = `${messages.profileTitleFirst} ${messages.profileTitleSecond}`.replace(/\.$/, "");
  const sectionTitle = title ?? (!user && (pathname === "/" || pathname.startsWith("/admin")) ? `${messages.brandFirst} ${messages.brandSecond}`
    : pathname.startsWith("/privacy") ? legalCopy[locale].privacy.eyebrow
    : pathname.startsWith("/par-risinajumu") ? legalCopy[locale].impressum.title.replace(/\.$/, "")
      : pathname === "/" ? dashboardTitle
    : pathname === "/profile" ? profileTitle
      : pathname === "/admin" ? adminMessages.usersRegistered
            : pathname.startsWith("/admin/federation") ? adminMessages.usersPeers
              : pathname.startsWith("/admin/email") ? adminMessages.usersEmail
                : pathname.startsWith("/admin/legal") ? adminMessages.legalTitle
                  : pathname.startsWith("/admin/settings") ? adminMessages.usersSettings
                    : pathname === "/help" ? adminMessages.usersHelp
                  : messages.navRequests);

  return <AppHeader title={sectionTitle} homeHref="/">{(closeMenu) => <>
        <div className="mobile-nav-links">
          {user && <Link href="/" onClick={closeMenu} className={pathname === "/" ? "active" : ""} aria-current={pathname === "/" ? "page" : undefined}>{messages.navRequests}</Link>}
          {showAdmin && <div className="mobile-nav-admin-section">
            <span>{messages.navAdmin}</span>
            {adminLinks.map((link) => <Link key={link.href} href={link.href} onClick={closeMenu} className={link.active ? "active" : ""} aria-current={link.active ? "page" : undefined}>{link.label}</Link>)}
          </div>}
          <div className="mobile-nav-information-section">
            <span>{messages.navInformation}</span>
            {informationLinks.map((link) => <Link key={link.href} href={link.href} onClick={closeMenu} className={link.active ? "active" : ""} aria-current={link.active ? "page" : undefined}>{link.label}</Link>)}
          </div>
        </div>
        {user && <div className="mobile-nav-footer">
          <div className="mobile-nav-person"><span className="avatar">{user.initials}</span><span><b>{user.displayName}</b><small>{user.company}</small></span></div>
          <div className="mobile-nav-profile-actions">
            <Link href="/profile" className="row-action icon-action" aria-label={messages.navProfile} title={messages.navProfile} onClick={closeMenu}><EditIcon /></Link>
            <LogoutButton redirectTo={logoutRedirect} iconOnly />
          </div>
        </div>}
      </>}</AppHeader>;
}
