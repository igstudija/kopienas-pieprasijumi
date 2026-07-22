import { describe, expect, it } from "vitest";
import { DUMMY_PASSWORD_HASH, hashPassword, verifyPassword } from "@/lib/password";

describe("administratoru paroles", () => {
  it("glabā scrypt hash un pārbauda pareizo paroli", async () => {
    const encoded = await hashPassword("ļoti-droša-parole-123");
    expect(encoded).toMatch(/^scrypt-v1:/);
    expect(encoded).not.toContain("ļoti-droša-parole-123");
    await expect(verifyPassword("ļoti-droša-parole-123", encoded)).resolves.toBe(true);
    await expect(verifyPassword("nepareiza-parole", encoded)).resolves.toBe(false);
  });

  it("noraida bojātu hash, bet saglabā vienādu scrypt ceļu neesošam lietotājam", async () => {
    await expect(verifyPassword("jebkas", "bojāts-hash")).resolves.toBe(false);
    await expect(verifyPassword("not-a-valid-admin-password", DUMMY_PASSWORD_HASH)).resolves.toBe(true);
  });
});
