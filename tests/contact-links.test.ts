import { describe, expect, it } from "vitest";
import { contactLinks } from "@/lib/contact-links";

describe("contactLinks", () => {
  it("creates email, phone, WhatsApp and website links from normalized contact data", () => {
    expect(contactLinks("Member@Example.com", "+37120000000", "example.com/contact#team")).toEqual({
      email: "mailto:member@example.com",
      phone: "tel:+37120000000",
      whatsapp: "https://wa.me/37120000000",
      website: "https://example.com/contact",
    });
  });

  it("does not expose migration placeholders or malformed contact values", () => {
    expect(contactLinks("migration-user@migration.invalid", "20000000", "javascript:alert(1)")).toEqual({
      email: null,
      phone: null,
      whatsapp: null,
      website: null,
    });
  });
});
