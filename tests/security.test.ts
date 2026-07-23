import { describe, expect, it } from "vitest";
import { decryptPhone, decryptSecret, emailLoginTokenDigest, encryptPhone, encryptSecret, normalizeEmail, normalizePhone, sessionDigest } from "@/lib/security";

describe("security helpers", () => {
  it("normalizes a Latvian phone number to E.164", () => {
    expect(normalizePhone("20000000")).toBe("+37120000000");
  });

  it("encrypts and decrypts a phone number", () => {
    const encrypted = encryptPhone("+37120000000");
    expect(encrypted).not.toContain("37120000000");
    expect(decryptPhone(encrypted)).toBe("+37120000000");
  });

  it("encrypts and decrypts an instance secret", () => {
    const encrypted = encryptSecret("smtp-api-key");
    expect(encrypted).not.toContain("smtp-api-key");
    expect(decryptSecret(encrypted)).toBe("smtp-api-key");
  });

  it("does not expose the raw token in a session digest", () => {
    expect(sessionDigest("secret-token")).toMatch(/^[a-f0-9]{64}$/);
    expect(sessionDigest("secret-token")).not.toContain("secret-token");
  });

  it("normalizes email and rejects an invalid address", () => {
    expect(normalizeEmail(" Owner@Example.COM ")).toBe("owner@example.com");
    expect(() => normalizeEmail("not-an-email")).toThrow();
  });

  it("does not expose the raw token in an email-link digest", () => {
    expect(emailLoginTokenDigest("one-time-secret")).toMatch(/^[a-f0-9]{64}$/);
    expect(emailLoginTokenDigest("one-time-secret")).not.toContain("one-time-secret");
  });
});
