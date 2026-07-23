import { describe, expect, it } from "vitest";
import { contactLinks } from "@/lib/contact-links";

describe("contactLinks", () => {
  it("creates email, phone and WhatsApp links from normalized contact data", () => {
    expect(contactLinks("Member@Example.com", "+37120000000")).toEqual({
      email: "mailto:member@example.com",
      phone: "tel:+37120000000",
      whatsapp: "https://wa.me/37120000000",
    });
  });

  it("does not expose migration placeholders or malformed phone values", () => {
    expect(contactLinks("migration-user@migration.invalid", "20000000")).toEqual({
      email: null,
      phone: null,
      whatsapp: null,
    });
  });
});
