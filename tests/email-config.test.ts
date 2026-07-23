import { describe, expect, it } from "vitest";
import { isCompleteEmailTransport, resolveEmailTransport } from "@/lib/email-config";

describe("email transport configuration", () => {
  it("uses the fixed Brevo SMTP endpoint", () => {
    const config = resolveEmailTransport({
      provider: "brevo",
      host: "attacker.invalid",
      port: 465,
      secure: true,
      username: "smtp-user",
      password: "smtp-key",
      fromAddress: "Sender@Example.com",
      fromName: "Specific requests",
    });
    expect(config).toMatchObject({
      host: "smtp-relay.brevo.com",
      port: 587,
      secure: false,
      fromAddress: "sender@example.com",
    });
    expect(isCompleteEmailTransport(config)).toBe(true);
  });

  it("requires complete custom SMTP settings", () => {
    const config = resolveEmailTransport({
      provider: "custom",
      host: "",
      port: 587,
      secure: false,
      username: "",
      password: "",
      fromAddress: "",
      fromName: "",
    });
    expect(isCompleteEmailTransport(config)).toBe(false);
  });
});
