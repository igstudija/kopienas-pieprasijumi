import { describe, expect, it } from "vitest";
import { isBlockedFederationAddress, validateFederationBaseUrl, validateFederationHandshakeEndpoint } from "@/lib/federation-endpoint";

const productionOptions = { allowLocalDevelopment: false };

describe("federation endpoint validation", () => {
  it("accepts an exact public HTTPS handshake endpoint", async () => {
    await expect(validateFederationHandshakeEndpoint("https://8.8.8.8/api/v1/federation/handshake", productionOptions)).resolves.toBeInstanceOf(URL);
  });

  it("rejects credentials, unexpected paths and non-HTTPS endpoints", async () => {
    await expect(validateFederationHandshakeEndpoint("https://user:pass@8.8.8.8/api/v1/federation/handshake", productionOptions)).rejects.toThrow();
    await expect(validateFederationHandshakeEndpoint("https://8.8.8.8/not-the-handshake", productionOptions)).rejects.toThrow();
    await expect(validateFederationHandshakeEndpoint("http://8.8.8.8/api/v1/federation/handshake", productionOptions)).rejects.toThrow();
  });

  it("rejects private literal and DNS-resolved destinations", async () => {
    await expect(validateFederationBaseUrl("https://127.0.0.1", productionOptions)).rejects.toThrow(/privātu tīklu/);
    await expect(validateFederationBaseUrl("https://peer.example", {
      ...productionOptions,
      resolveHostname: async () => [{ address: "10.0.0.5", family: 4 }],
    })).rejects.toThrow(/privātu tīklu/);
  });

  it("classifies reserved IPv4, IPv6 and mapped addresses", () => {
    expect(isBlockedFederationAddress("169.254.169.254")).toBe(true);
    expect(isBlockedFederationAddress("::1")).toBe(true);
    expect(isBlockedFederationAddress("::ffff:127.0.0.1")).toBe(true);
    expect(isBlockedFederationAddress("8.8.8.8")).toBe(false);
  });
});
