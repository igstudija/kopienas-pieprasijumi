"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { Handshake } from "lucide-react";
import { Brand } from "./brand";
import { useLanguage } from "./language-provider";
import { useModalDialog } from "@/lib/use-modal-dialog";

export function AppHeader({ title, homeHref = "/", drawerId = "mobile-navigation", children }: {
  title: string;
  homeHref?: string;
  drawerId?: string;
  children: (closeMenu: () => void) => ReactNode;
}) {
  const { messages } = useLanguage();
  const [open, setOpen] = useState(false);
  const closeMenu = () => setOpen(false);
  const drawerRef = useModalDialog<HTMLElement>(open, closeMenu);

  return (
    <>
      <nav className="app-nav">
        <Brand href={homeHref} markIcon={<Handshake strokeWidth={1.8} />} label={title} />
        <button className="mobile-nav-toggle" type="button" aria-label={open ? messages.closeMenu : messages.openMenu} aria-expanded={open} aria-controls={drawerId} onClick={() => setOpen((current) => !current)}><span /><span /><span /></button>
      </nav>
      {open && <button className="mobile-nav-backdrop" type="button" aria-label={messages.closeMenu} onClick={closeMenu} />}
      <aside ref={drawerRef} id={drawerId} className={`mobile-nav-drawer ${open ? "open" : ""}`} role="dialog" aria-modal={open} aria-label={messages.menu} aria-hidden={!open} inert={!open} tabIndex={-1}>
        <header><span>{messages.menu}</span><button type="button" onClick={closeMenu} aria-label={messages.closeMenu}>×</button></header>
        {children(closeMenu)}
      </aside>
    </>
  );
}
