"use client";

import { createContext, useContext } from "react";
import { globalMessages, type Locale } from "@/lib/i18n";

type LanguageContextValue = {
  locale: Locale;
  messages: (typeof globalMessages)[Locale];
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ initialLocale, children }: { initialLocale: Locale; children: React.ReactNode }) {
  return <LanguageContext.Provider value={{ locale: initialLocale, messages: globalMessages[initialLocale] }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used inside LanguageProvider.");
  return context;
}
