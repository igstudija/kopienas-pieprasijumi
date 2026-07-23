import type { Metadata, Viewport } from "next";
import { Figtree, Outfit } from "next/font/google";
import { CookieNotice } from "@/components/cookie-notice";
import { LanguageProvider } from "@/components/language-provider";
import { SiteFooter } from "@/components/site-footer";
import { getInstanceLocale } from "@/lib/services/instance-settings";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
  weight: "variable",
});
const figtree = Figtree({
  subsets: ["latin", "latin-ext"],
  variable: "--font-serif",
  weight: "variable",
});

export const metadata: Metadata = {
  title: { default: "Specifiskie prasījumi", template: "%s · Specifiskie prasījumi" },
  description: "Atrodi īsto kontaktu caur cilvēkiem, kuriem uzticies.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = { themeColor: "#12372a", colorScheme: "light" };

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await getInstanceLocale();
  return (
    <html lang={locale} className={`${outfit.variable} ${figtree.variable}`}>
      <body><LanguageProvider initialLocale={locale}><div className="site-frame">{children}</div><SiteFooter /><CookieNotice /></LanguageProvider></body>
    </html>
  );
}
