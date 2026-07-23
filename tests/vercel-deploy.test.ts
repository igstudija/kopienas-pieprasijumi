import { describe, expect, it } from "vitest";
import { vercelDeployUrl } from "@/lib/vercel-deploy";

describe("Vercel deploy URL", () => {
  it("requests the installation secret without deprecated integration parameters", () => {
    const value = new URL(vercelDeployUrl("https://github.com/example/community"));
    expect(value.origin).toBe("https://vercel.com");
    expect(value.searchParams.get("repository-url")).toBe("https://github.com/example/community");
    expect(value.searchParams.get("env")).toBe("SETUP_SECRET");
    expect(value.searchParams.get("envDescription")).toContain("first-run wizard");
    expect(value.searchParams.has("stores")).toBe(false);
    expect(value.searchParams.has("integration-ids")).toBe(false);
    expect(value.searchParams.has("products")).toBe(false);
  });
});
