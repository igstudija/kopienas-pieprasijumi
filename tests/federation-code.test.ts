import { describe, expect, it } from "vitest";
import { decodePairingCode, pairingCodePreview } from "@/lib/federation-code";

function codeFor(payload: Record<string, unknown>) {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

describe("federation pairing code", () => {
  const payload = {
    endpoint: "https://cita-grupa.example/api/v1/federation/handshake",
    inviteId: "a1b2c3",
    secret: "vienreizejs-noslepums",
    expiresAt: "2030-01-02T03:04:05.000Z",
    issuerName: "BNI Cita grupa",
    issuerBaseUrl: "https://cita-grupa.example",
  };

  it("decodes the connection payload", () => {
    expect(decodePairingCode(codeFor(payload))).toMatchObject(payload);
  });

  it("shows the domain embedded in the code", () => {
    expect(pairingCodePreview(codeFor(payload))).toEqual({
      domain: "https://cita-grupa.example",
      issuerName: "BNI Cita grupa",
      expiresAt: payload.expiresAt,
    });
  });

  it("rejects malformed codes", () => {
    expect(() => decodePairingCode("nav-derigs-kods")).toThrow();
    expect(() => pairingCodePreview(codeFor({ ...payload, endpoint: "not-a-url" }))).toThrow();
  });
});
