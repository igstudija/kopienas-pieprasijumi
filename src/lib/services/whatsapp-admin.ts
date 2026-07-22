import "server-only";

import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { instanceSettings, type User } from "@/lib/db/schema";
import { HttpError } from "@/lib/http";
import { decryptSecret, encryptSecret, generateToken, normalizePhone } from "@/lib/security";
import { writeAudit } from "./audit";

type AuditMeta = { ipAddress?: string | null; requestId?: string | null };

export async function getWhatsappAdminSettings() {
  const [settings] = await getDb().select().from(instanceSettings).limit(1);
  if (!settings) throw new HttpError(409, "Installation is not complete.");
  return {
    businessNumber: settings.whatsappBusinessNumber ?? process.env.WHATSAPP_BUSINESS_NUMBER ?? "",
    appSecretConfigured: Boolean(settings.whatsappAppSecretEncrypted || process.env.WHATSAPP_APP_SECRET),
    webhookUrl: `${settings.baseUrl.replace(/\/$/, "")}/api/v1/whatsapp/webhook`,
    verifyToken: settings.whatsappWebhookVerifyTokenEncrypted ? decryptSecret(settings.whatsappWebhookVerifyTokenEncrypted) : process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN ?? "",
    privacyUrl: `${settings.baseUrl.replace(/\/$/, "")}/privacy`,
    deletionUrl: `${settings.baseUrl.replace(/\/$/, "")}/privacy#data-deletion`,
  };
}

export async function updateWhatsappAdminSettings(actor: User, input: { businessNumber: string; appSecret?: string | null; regenerateVerifyToken?: boolean }, audit: AuditMeta) {
  if (actor.role === "member") throw new HttpError(403, "Insufficient permissions.");
  const db = getDb();
  const [settings] = await db.select().from(instanceSettings).limit(1);
  if (!settings) throw new HttpError(409, "Installation is not complete.");
  const businessNumber = normalizePhone(input.businessNumber);
  const verifyToken = input.regenerateVerifyToken || !settings.whatsappWebhookVerifyTokenEncrypted
    ? generateToken(24)
    : decryptSecret(settings.whatsappWebhookVerifyTokenEncrypted);

  await db.transaction(async (tx) => {
    await tx.update(instanceSettings).set({
      whatsappBusinessNumber: businessNumber,
      ...(input.appSecret?.trim() ? { whatsappAppSecretEncrypted: encryptSecret(input.appSecret.trim()) } : {}),
      whatsappWebhookVerifyTokenEncrypted: encryptSecret(verifyToken),
      updatedAt: new Date(),
    }).where(eq(instanceSettings.id, settings.id));
    await writeAudit(tx, {
      actorUserId: actor.id,
      action: "instance.whatsapp_settings_updated",
      objectType: "instance",
      objectId: settings.id,
      details: { businessNumberLast4: businessNumber.slice(-4), appSecretChanged: Boolean(input.appSecret?.trim()), verifyTokenRegenerated: Boolean(input.regenerateVerifyToken) },
      ipAddress: audit.ipAddress,
      requestId: audit.requestId,
    });
  });
  return getWhatsappAdminSettings();
}
