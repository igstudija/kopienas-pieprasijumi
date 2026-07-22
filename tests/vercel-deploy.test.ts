import { describe, expect, it } from "vitest";
import { vercelDeployUrl } from "@/lib/vercel-deploy";

describe("Vercel deploy URL", () => {
  it("pieprasa instalācijas paroli un Supabase produktu", () => {
    const value = new URL(vercelDeployUrl("https://github.com/example/community"));
    expect(value.origin).toBe("https://vercel.com");
    expect(value.searchParams.get("repository-url")).toBe("https://github.com/example/community");
    expect(value.searchParams.get("env")).toBe("SETUP_SECRET");
    expect(JSON.parse(value.searchParams.get("products") ?? "{}")).toEqual({
      integrationSlug: "supabase",
      productSlug: "supabase",
      protocol: "storage",
    });
  });
});
