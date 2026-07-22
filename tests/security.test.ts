import { describe, expect, it } from "vitest";
import { decryptPhone, decryptSecret, encryptPhone, encryptSecret, normalizePhone, sessionDigest } from "@/lib/security";

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
    const encrypted = encryptSecret("meta-app-secret");
    expect(encrypted).not.toContain("meta-app-secret");
    expect(decryptSecret(encrypted)).toBe("meta-app-secret");
  });

  it("sesijas digest nav neapstrādāts tokens", () => {
    expect(sessionDigest("secret-token")).toMatch(/^[a-f0-9]{64}$/);
    expect(sessionDigest("secret-token")).not.toContain("secret-token");
  });
});
