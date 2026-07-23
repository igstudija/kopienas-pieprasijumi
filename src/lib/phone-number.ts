import {
  AsYouType,
  getCountryCallingCode,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js";
import type { Locale } from "./i18n";

export const DEFAULT_PHONE_COUNTRY: CountryCode = "LV";

export function splitPhoneValue(value: string, fallbackCountry: CountryCode = DEFAULT_PHONE_COUNTRY) {
  const trimmed = value.trim();
  if (!trimmed) return { country: fallbackCountry, national: "" };

  const parsed = parsePhoneNumberFromString(trimmed, fallbackCountry);
  if (parsed?.country) {
    return {
      country: parsed.country,
      national: parsed.formatNational(),
    };
  }

  return {
    country: fallbackCountry,
    national: formatNationalPhoneInput(trimmed.replace(/^\+\d{1,4}/, ""), fallbackCountry),
  };
}

export function formatNationalPhoneInput(value: string, country: CountryCode) {
  return new AsYouType(country).input(value.replace(/[^\d]/g, ""));
}

export function composePhoneValue(country: CountryCode, national: string) {
  const trimmed = national.trim();
  if (!trimmed) return "";

  const parsed = parsePhoneNumberFromString(trimmed, country);
  if (parsed) return parsed.number;

  const digits = trimmed.replace(/\D/g, "");
  return digits ? `+${getCountryCallingCode(country)}${digits}` : "";
}

export function phoneCountryFromLocale(locale: Locale): CountryCode {
  if (locale === "lt") return "LT";
  if (locale === "et") return "EE";
  return "LV";
}
