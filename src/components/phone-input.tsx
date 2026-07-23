"use client";

import { useMemo, useState } from "react";
import {
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js";
import type { Locale } from "@/lib/i18n";
import {
  composePhoneValue,
  DEFAULT_PHONE_COUNTRY,
  formatNationalPhoneInput,
  splitPhoneValue,
} from "@/lib/phone-number";

type PhoneInputProps = {
  id: string;
  name: string;
  locale: Locale;
  countryLabel: string;
  defaultCountry?: CountryCode;
  defaultValue?: string;
  onChange?: (value: string) => void;
  required?: boolean;
  autoFocus?: boolean;
};

const PRIORITY_COUNTRIES: CountryCode[] = ["LV", "LT", "EE"];

export function PhoneInput({
  id,
  name,
  locale,
  countryLabel,
  defaultCountry = DEFAULT_PHONE_COUNTRY,
  defaultValue = "",
  onChange,
  required = false,
  autoFocus = false,
}: PhoneInputProps) {
  const initial = splitPhoneValue(defaultValue, defaultCountry);
  const [country, setCountry] = useState<CountryCode>(initial.country);
  const [national, setNational] = useState(initial.national);
  const submittedValue = composePhoneValue(country, national);
  const options = useMemo(() => countryOptions(locale), [locale]);

  function update(nextCountry: CountryCode, nextNational: string) {
    setCountry(nextCountry);
    setNational(nextNational);
    onChange?.(composePhoneValue(nextCountry, nextNational));
  }

  function updateNumber(rawValue: string) {
    if (rawValue.trim().startsWith("+")) {
      const parsed = parsePhoneNumberFromString(rawValue);
      if (parsed?.country) {
        update(parsed.country, parsed.formatNational());
        return;
      }
    }
    update(country, formatNationalPhoneInput(rawValue, country));
  }

  return (
    <div className="phone-input">
      <select
        className="field phone-country-select"
        value={country}
        onChange={(event) => update(event.target.value as CountryCode, national)}
        aria-label={countryLabel}
      >
        {options.map((option) => (
          <option value={option.code} key={option.code}>
            {option.flag} {option.name} (+{option.callingCode})
          </option>
        ))}
      </select>
      <div className="phone-number-control">
        <span aria-hidden="true">+{getCountryCallingCode(country)}</span>
        <input
          className="field"
          id={id}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          value={national}
          onChange={(event) => updateNumber(event.target.value)}
          required={required}
          autoFocus={autoFocus}
        />
      </div>
      <input type="hidden" name={name} value={submittedValue} />
    </div>
  );
}

function countryOptions(locale: Locale) {
  const displayNames = new Intl.DisplayNames([locale], { type: "region" });
  const countries = getCountries();
  const priority = new Map(PRIORITY_COUNTRIES.map((country, index) => [country, index]));

  return countries
    .map((code) => ({
      code,
      name: displayNames.of(code) ?? code,
      flag: countryFlag(code),
      callingCode: getCountryCallingCode(code),
    }))
    .sort((left, right) => {
      const leftPriority = priority.get(left.code);
      const rightPriority = priority.get(right.code);
      if (leftPriority !== undefined || rightPriority !== undefined) {
        return (leftPriority ?? PRIORITY_COUNTRIES.length) - (rightPriority ?? PRIORITY_COUNTRIES.length);
      }
      return left.name.localeCompare(right.name, locale);
    });
}

function countryFlag(country: CountryCode) {
  return country
    .split("")
    .map((character) => String.fromCodePoint(127397 + character.charCodeAt(0)))
    .join("");
}
