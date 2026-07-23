import { describe, expect, it } from "vitest";
import { decryptPhone, decryptSecret, emailLoginTokenDigest, encryptPhone, encryptSecret, normalizeEmail, normalizePhone, sessionDigest } from "@/lib/security";

describe("security helpers", () => {
  it("normalizē Latvijas numuru E.164 formātā", () => {
    expect(normalizePhone("20000000")).toBe("+37120000000");
  });

  it("šifrē un atšifrē numuru", () => {
    const encrypted = encryptPhone("+37120000000");
    expect(encrypted).not.toContain("37120000000");
    expect(decryptPhone(encrypted)).toBe("+37120000000");
  });

  it("šifrē un atšifrē instances noslēpumu", () => {
    const encrypted = encryptSecret("smtp-api-key");
    expect(encrypted).not.toContain("smtp-api-key");
    expect(decryptSecret(encrypted)).toBe("smtp-api-key");
  });

  it("sesijas digest nav neapstrādāts tokens", () => {
    expect(sessionDigest("secret-token")).toMatch(/^[a-f0-9]{64}$/);
    expect(sessionDigest("secret-token")).not.toContain("secret-token");
  });

  it("normalizē e-pastu un noraida nederīgu adresi", () => {
    expect(normalizeEmail(" Owner@Example.COM ")).toBe("owner@example.com");
    expect(() => normalizeEmail("not-an-email")).toThrow();
  });

  it("e-pasta saites digest neietver neapstrādātu tokenu", () => {
    expect(emailLoginTokenDigest("one-time-secret")).toMatch(/^[a-f0-9]{64}$/);
    expect(emailLoginTokenDigest("one-time-secret")).not.toContain("one-time-secret");
  });
});
