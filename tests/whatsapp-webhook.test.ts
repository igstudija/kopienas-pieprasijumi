import { describe, expect, it } from "vitest";
import { extractWhatsappTextMessages } from "@/lib/whatsapp-webhook";

describe("WhatsApp webhook parser", () => {
  it("nolasa sūtītāja numuru un login ziņu", () => {
    const payload = { entry: [{ changes: [{ value: { messages: [{ from: "37120000000", type: "text", text: { body: "PIETEIKTIES abcdefghijklmnopqrstuvwx" } }] } }] }] };
    expect(extractWhatsappTextMessages(payload)).toEqual([{ from: "37120000000", text: "PIETEIKTIES abcdefghijklmnopqrstuvwx" }]);
  });

  it("ignorē citus ziņu tipus", () => {
    expect(extractWhatsappTextMessages({ entry: [{ changes: [{ value: { messages: [{ from: "1", type: "image" }] } }] }] })).toEqual([]);
  });
});
