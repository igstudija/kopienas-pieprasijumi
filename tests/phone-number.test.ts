import { describe, expect, it } from "vitest";
import {
  composePhoneValue,
  formatNationalPhoneInput,
  phoneCountryFromLocale,
  splitPhoneValue,
} from "@/lib/phone-number";

describe("phone number helpers", () => {
  it("splits an E.164 number into country and readable national number", () => {
    expect(splitPhoneValue("+37129287356")).toEqual({
      country: "LV",
      national: "29 287 356",
    });
  });

  it("composes local input as an E.164 value", () => {
    expect(composePhoneValue("LT", "612 34 567")).toBe("+37061234567");
  });

  it("formats national input without losing digits", () => {
    expect(formatNationalPhoneInput("29287356", "LV")).toBe("29 287 356");
  });

  it("uses the installation locale for the initial country", () => {
    expect(phoneCountryFromLocale("lv")).toBe("LV");
    expect(phoneCountryFromLocale("lt")).toBe("LT");
    expect(phoneCountryFromLocale("et")).toBe("EE");
  });
});
