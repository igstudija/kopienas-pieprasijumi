import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { appSecret, encryptionKey, phoneLookupSecret } from "./env";

export function normalizePhone(input: string) {
  const phone = parsePhoneNumberFromString(input.trim(), "LV");
  if (!phone?.isValid()) throw new Error("Ievadi derīgu tālruņa numuru.");
  return phone.number;
}

export function normalizeEmail(input: string) {
  const email = input.trim().toLowerCase();
  if (email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Ievadi derīgu e-pasta adresi.");
  }
  return email;
}

export function phoneLookup(phoneE164: string) {
  return hmac(phoneLookupSecret(), phoneE164);
}

export function encryptPhone(phoneE164: string) {
  return encryptValue(phoneE164);
}

export function encryptSecret(value: string) {
  return encryptValue(value);
}

function encryptValue(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

export function decryptPhone(value: string) {
  return decryptValue(value);
}

export function decryptSecret(value: string) {
  return decryptValue(value);
}

function decryptValue(value: string) {
  const [ivRaw, tagRaw, encryptedRaw] = value.split(".");
  if (!ivRaw || !tagRaw || !encryptedRaw) throw new Error("Nederīgs šifrēta numura formāts.");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivRaw, "base64url"));
  decipher.setAuthTag(Buffer.from(tagRaw, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(encryptedRaw, "base64url")), decipher.final()]).toString("utf8");
}

export function generateToken(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}

export function sessionDigest(token: string) {
  return hmac(appSecret(), `session:${token}`);
}

export function inviteDigest(secret: string) {
  return hmac(appSecret(), `invite:${secret}`);
}

export function emailLoginTokenDigest(token: string) {
  return hmac(appSecret(), `email-login:${token}`);
}

export function emailLoginAddressDigest(email: string) {
  return hmac(appSecret(), `email-login-address:${normalizeEmail(email)}`);
}

export function safeEqualHex(left: string, right: string) {
  const a = Buffer.from(left, "hex");
  const b = Buffer.from(right, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

export function sha256(value: string | Buffer) {
  return createHash("sha256").update(value).digest("hex");
}

function hmac(secret: string, value: string) {
  return createHmac("sha256", secret).update(value).digest("hex");
}
