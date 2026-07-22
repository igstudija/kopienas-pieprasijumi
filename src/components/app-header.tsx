"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { Brand } from "./brand";
import { useLanguage } from "./language-provider";

export function AppHeader({ title, drawerId = "mobile-navigation", children }: {
  title: string;
  drawerId?: string;
  children: (closeMenu: () => void) => ReactNode;
}) {
  const { messages } = useLanguage();
  const [open, setOpen] = useState(false);
  const closeMenu = () => setOpen(false);

  return (
    <>
      <nav className="app-nav">
        <Brand href="/app" markText="SP" label={title} />
        <button className="mobile-nav-toggle" type="button" aria-label={open ? messages.closeMenu : messages.openMenu} aria-expanded={open} aria-controls={drawerId} onClick={() => setOpen((current) => !current)}><span /><span /><span /></button>
      </nav>
      {open && <button className="mobile-nav-backdrop" type="button" aria-label={messages.closeMenu} onClick={closeMenu} />}
      <aside id={drawerId} className={`mobile-nav-drawer ${open ? "open" : ""}`} aria-hidden={!open}>
        <header><span>{messages.menu}</span><button type="button" onClick={closeMenu} aria-label={messages.closeMenu}>×</button></header>
        {children(closeMenu)}
      </aside>
    </>
  );
}
