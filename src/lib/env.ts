import { createHmac } from "node:crypto";

const DEV_SECRET = "development-only-secret-change-before-production";
const DEV_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");

export function databaseUrl() {
  const value = process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? process.env.POSTGRES_PRISMA_URL;
  if (!value) throw new Error("Datubāzes pieslēgums nav konfigurēts. Pieslēdz Supabase projektu Vercel projektam.");
  return value;
}

function installationRootSecret() {
  return process.env.INSTANCE_MASTER_KEY
    ?? process.env.SUPABASE_SECRET_KEY
    ?? process.env.SUPABASE_SERVICE_ROLE_KEY
    ?? process.env.DATABASE_URL
    ?? process.env.POSTGRES_URL
    ?? process.env.POSTGRES_PRISMA_URL
    ?? (process.env.NODE_ENV === "production" ? undefined : DEV_SECRET);
}

function derivedSecret(label: string) {
  const root = installationRootSecret();
  if (!root) throw new Error("Nav pieejama instances pamata atslēga.");
  return createHmac("sha256", root).update(`kopienas-pieprasijumi:${label}:v1`).digest();
}

export function appSecret() {
  return process.env.APP_SECRET ?? derivedSecret("sessions").toString("base64url");
}

export function phoneLookupSecret() {
  return process.env.PHONE_LOOKUP_SECRET ?? derivedSecret("phone-lookup").toString("base64url");
}

export function encryptionKey() {
  const raw = process.env.DATA_ENCRYPTION_KEY;
  if (!raw) return process.env.NODE_ENV === "production" ? derivedSecret("data-encryption") : Buffer.from(DEV_ENCRYPTION_KEY, "base64");
  const decoded = Buffer.from(raw, "base64");
  if (decoded.length !== 32) throw new Error("DATA_ENCRYPTION_KEY jābūt 32 baitu base64 vērtībai.");
  return decoded;
}

export function appUrl() {
  const value = process.env.APP_URL
    ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined)
    ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined)
    ?? "http://localhost:3020";
  return value.replace(/\/$/, "");
}

export function instanceId() {
  return process.env.INSTANCE_ID ?? "00000000-0000-4000-8000-000000000001";
}

export function setupSecret() {
  return process.env.SETUP_SECRET ?? (process.env.NODE_ENV === "production" ? null : "development-setup");
}
