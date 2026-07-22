import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { Figtree, Outfit } from "next/font/google";
import { CookieNotice } from "@/components/cookie-notice";
import { LanguageProvider } from "@/components/language-provider";
import { SiteFooter } from "@/components/site-footer";
import { parseLocale } from "@/lib/i18n";
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
  const locale = parseLocale((await cookies()).get("community_locale")?.value);
  return (
    <html lang={locale} className={`${outfit.variable} ${figtree.variable}`}>
      <body><LanguageProvider initialLocale={locale}>{children}<SiteFooter /><CookieNotice /></LanguageProvider></body>
    </html>
  );
}
