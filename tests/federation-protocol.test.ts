import { describe, expect, it } from "vitest";
import { assertFederationEventOrigin } from "@/lib/federation-protocol";

describe("federation event origin binding", () => {
  it("accepts the origin bound to the signing peer", () => {
    expect(() => assertFederationEventOrigin("peer-a", "peer-a")).not.toThrow();
  });

  it("rejects a missing or different claimed origin", () => {
    expect(() => assertFederationEventOrigin(null, "peer-a")).toThrow();
    expect(() => assertFederationEventOrigin("peer-a", "peer-b")).toThrow();
  });
});
