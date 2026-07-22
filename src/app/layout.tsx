import type { Metadata, Viewport } from "next";
import { Manrope, Newsreader } from "next/font/google";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-sans" });
const newsreader = Newsreader({ subsets: ["latin"], variable: "--font-serif" });

export const metadata: Metadata = {
  title: { default: "Kopienas pieprasījumi", template: "%s · Kopienas pieprasījumi" },
  description: "Atrodi īsto kontaktu caur cilvēkiem, kuriem uzticies.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = { themeColor: "#12372a", colorScheme: "light" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="lv" className={`${manrope.variable} ${newsreader.variable}`}>
      <body>{children}</body>
    </html>
  );
}
