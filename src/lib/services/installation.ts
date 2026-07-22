import "server-only";

import { generateKeyPairSync } from "node:crypto";
import { getDb } from "@/lib/db";
import { auditLog, instanceSettings, users } from "@/lib/db/schema";
import { appUrl, instanceId, setupSecret } from "@/lib/env";
import { HttpError } from "@/lib/http";
import {
  decryptSecret,
  encryptPhone,
  encryptSecret,
  generateToken,
  normalizePhone,
  phoneLookup,
  safeEqualHex,
  sha256,
} from "@/lib/security";

export type InstallationInput = {
  setupPassword: string;
  instanceName: string;
  timezone: string;
  locale: string;
  whatsappBusinessNumber: string;
  whatsappAppSecret: string;
  owner: {
    firstName: string;
    lastName: string;
    company: string;
    email?: string | null;
    phone: string;
  };
};

export async function isInstalled() {
  const [instance] = await getDb().select({ id: instanceSettings.id }).from(instanceSettings).limit(1);
  return Boolean(instance);
}

export async function installationStatus() {
  try {
    return {
      databaseConnected: true,
      installed: await isInstalled(),
      setupPasswordConfigured: Boolean(setupSecret()),
      databaseProvider: process.env.SUPABASE_URL || process.env.POSTGRES_URL ? "Supabase" : "PostgreSQL",
      detectedUrl: appUrl(),
    };
  } catch (error) {
    return {
      databaseConnected: false,
      installed: false,
      setupPasswordConfigured: Boolean(setupSecret()),
      databaseProvider: process.env.SUPABASE_URL || process.env.POSTGRES_URL ? "Supabase" : "PostgreSQL",
      detectedUrl: appUrl(),
      error: error instanceof Error ? error.message : "Datubāzes savienojumu neizdevās pārbaudīt.",
    };
  }
}

export async function completeInstallation(input: InstallationInput, audit: { ipAddress?: string | null; requestId?: string | null }) {
  verifySetupPassword(input.setupPassword);
  const ownerPhone = normalizePhone(input.owner.phone);
  const businessNumber = normalizePhone(input.whatsappBusinessNumber);
  const baseUrl = appUrl();
  const instanceUuid = crypto.randomUUID();
  const ownerId = crypto.randomUUID();
  const verifyToken = generateToken(24);
  const keyId = `primary-${new Date().getUTCFullYear()}`;
  const pair = generateKeyPairSync("ed25519");
  const publicKey = pair.publicKey.export({ type: "spki", format: "der" }).toString("base64");
  const privateKey = pair.privateKey.export({ type: "pkcs8", format: "der" }).toString("base64");
  const db = getDb();

  try {
    await db.transaction(async (tx) => {
      const [existing] = await tx.select({ id: instanceSettings.id }).from(instanceSettings).limit(1);
      if (existing) throw new HttpError(409, "Šī instance jau ir konfigurēta.");

      await tx.insert(instanceSettings).values({
        id: instanceUuid,
        singletonKey: true,
        name: input.instanceName.trim(),
        baseUrl,
        timezone: input.timezone,
        locale: input.locale,
        federationPublicKey: publicKey,
        federationPrivateKeyEncrypted: encryptSecret(privateKey),
        federationKeyId: keyId,
        whatsappBusinessNumber: businessNumber,
        whatsappAppSecretEncrypted: encryptSecret(input.whatsappAppSecret.trim()),
        whatsappWebhookVerifyTokenEncrypted: encryptSecret(verifyToken),
        setupCompletedAt: new Date(),
      });
      await tx.insert(users).values({
        id: ownerId,
        firstName: input.owner.firstName.trim(),
        lastName: input.owner.lastName.trim(),
        displayName: `${input.owner.firstName} ${input.owner.lastName}`.trim(),
        company: input.owner.company.trim(),
        email: input.owner.email?.trim() || null,
        phoneEncrypted: encryptPhone(ownerPhone),
        phoneLookup: phoneLookup(ownerPhone),
        phoneLast4: ownerPhone.slice(-4),
        role: "owner",
        status: "active",
      });
      await tx.insert(auditLog).values({
        actorUserId: ownerId,
        action: "installation.completed",
        objectType: "instance",
        objectId: instanceUuid,
        details: { name: input.instanceName.trim(), baseUrl, databaseProvider: process.env.SUPABASE_URL ? "supabase" : "postgresql" },
        ipAddress: audit.ipAddress ?? null,
        requestId: audit.requestId ?? null,
      });
    });
  } catch (error) {
    if (error instanceof HttpError) throw error;
    if (error instanceof Error && /instance_settings_singleton_uq|duplicate key/i.test(error.message)) {
      throw new HttpError(409, "Šī instance jau ir konfigurēta.");
    }
    throw error;
  }

  return {
    instanceId: instanceUuid,
    ownerId,
    webhookUrl: `${baseUrl}/api/v1/whatsapp/webhook`,
    webhookVerifyToken: verifyToken,
  };
}

export async function getInstanceRuntime() {
  const [stored] = await getDb().select().from(instanceSettings).limit(1);
  if (stored) {
    return {
      instanceId: stored.id,
      name: stored.name,
      baseUrl: stored.baseUrl.replace(/\/$/, ""),
      protocolVersion: stored.federationProtocol,
      keyId: stored.federationKeyId ?? "primary",
      publicKey: stored.federationPublicKey ?? "",
      privateKey: stored.federationPrivateKeyEncrypted
        ? decryptSecret(stored.federationPrivateKeyEncrypted)
        : process.env.FEDERATION_PRIVATE_KEY ?? "",
      whatsappBusinessNumber: stored.whatsappBusinessNumber ?? process.env.WHATSAPP_BUSINESS_NUMBER ?? "",
      whatsappAppSecret: stored.whatsappAppSecretEncrypted
        ? decryptSecret(stored.whatsappAppSecretEncrypted)
        : process.env.WHATSAPP_APP_SECRET ?? "",
      whatsappWebhookVerifyToken: stored.whatsappWebhookVerifyTokenEncrypted
        ? decryptSecret(stored.whatsappWebhookVerifyTokenEncrypted)
        : process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN ?? "",
    };
  }

  return {
    instanceId: instanceId(),
    name: process.env.INSTANCE_NAME ?? "Uzņēmēju kopiena",
    baseUrl: appUrl(),
    protocolVersion: 1,
    keyId: process.env.FEDERATION_KEY_ID ?? "primary",
    publicKey: process.env.FEDERATION_PUBLIC_KEY ?? "",
    privateKey: process.env.FEDERATION_PRIVATE_KEY ?? "",
    whatsappBusinessNumber: process.env.WHATSAPP_BUSINESS_NUMBER ?? "",
    whatsappAppSecret: process.env.WHATSAPP_APP_SECRET ?? "",
    whatsappWebhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN ?? "",
  };
}

function verifySetupPassword(received: string) {
  const expected = setupSecret();
  if (!expected) throw new HttpError(503, "SETUP_SECRET nav konfigurēts Vercel projekta iestatījumos.");
  if (!safeEqualHex(sha256(`setup:${received}`), sha256(`setup:${expected}`))) {
    throw new HttpError(401, "Instalācijas parole nav pareiza.");
  }
}
