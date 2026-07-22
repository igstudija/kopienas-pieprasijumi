"use client";

import { createContext, useContext, useState } from "react";
import { useRouter } from "next/navigation";
import { globalMessages, localeLabels, supportedLocales, type Locale } from "@/lib/i18n";

type LanguageContextValue = {
  locale: Locale;
  messages: (typeof globalMessages)[Locale];
  setLocale: (locale: Locale) => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ initialLocale, children }: { initialLocale: Locale; children: React.ReactNode }) {
  const router = useRouter();
  const [locale, setLocaleState] = useState(initialLocale);

  function setLocale(localeValue: Locale) {
    setLocaleState(localeValue);
    document.cookie = `community_locale=${localeValue}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
    document.documentElement.lang = localeValue;
    router.refresh();
  }

  return <LanguageContext.Provider value={{ locale, messages: globalMessages[locale], setLocale }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used inside LanguageProvider.");
  return context;
}

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, messages, setLocale } = useLanguage();
  return (
    <div className={`language-switcher ${compact ? "compact" : ""}`} aria-label={messages.language}>
      {supportedLocales.map((item) => (
        <button key={item} type="button" className={locale === item ? "active" : ""} onClick={() => setLocale(item)} aria-pressed={locale === item}>
          {localeLabels[item]}
        </button>
      ))}
    </div>
  );
}
