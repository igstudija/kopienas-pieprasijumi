import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchJson, jsonRequest } from "@/lib/client-api";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchJson", () => {
  it("returns a successful JSON response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "content-type": "application/json" } }),
    ));

    await expect(fetchJson<{ ok: boolean }>("/api/test")).resolves.toEqual({ ok: true });
  });

  it("turns API errors into a typed exception", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: "Invalid request." }), { status: 422 }),
    ));

    await expect(fetchJson("/api/test")).rejects.toMatchObject({
      name: "ApiError",
      message: "Invalid request.",
      status: 422,
    });
  });

  it("handles empty successful responses", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 204 })));

    await expect(fetchJson("/api/test")).resolves.toBeUndefined();
  });
});

describe("jsonRequest", () => {
  it("serializes a request body and preserves custom headers", () => {
    const request = jsonRequest("PATCH", { enabled: true }, { headers: { "x-test": "1" } });
    expect(request).toMatchObject({
      method: "PATCH",
      body: JSON.stringify({ enabled: true }),
    });
    expect(new Headers(request.headers).get("content-type")).toBe("application/json");
    expect(new Headers(request.headers).get("x-test")).toBe("1");
  });
});
