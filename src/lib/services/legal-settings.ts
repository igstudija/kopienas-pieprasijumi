import "server-only";

import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { instanceSettings, type User } from "@/lib/db/schema";
import type { LegalSettings, LegalSettingsInput } from "@/lib/legal-settings";
import { HttpError } from "@/lib/http";
import { writeAudit } from "./audit";

type AuditMeta = { ipAddress?: string | null; requestId?: string | null };

export async function getLegalSettings(): Promise<LegalSettings> {
  const [settings] = await getDb().select().from(instanceSettings).limit(1);
  return {
    instanceName: settings?.name ?? "Specifiskie prasījumi",
    legalEntityName: settings?.legalEntityName ?? "",
    legalRegistrationNumber: settings?.legalRegistrationNumber ?? "",
    legalAddress: settings?.legalAddress ?? "",
    legalCountry: settings?.legalCountry ?? "",
    legalEmail: settings?.legalEmail ?? "",
    legalPhone: settings?.legalPhone ?? "",
    privacyContactEmail: settings?.privacyContactEmail ?? settings?.legalEmail ?? "",
    dataRetentionMonths: settings?.dataRetentionMonths ?? 24,
  };
}

export async function updateLegalSettings(actor: User, input: LegalSettingsInput, audit: AuditMeta) {
  if (actor.role === "member") throw new HttpError(403, "Nepietiekamas tiesības.");
  const db = getDb();
  const [settings] = await db.select({ id: instanceSettings.id }).from(instanceSettings).limit(1);
  if (!settings) throw new HttpError(409, "Instalācija vēl nav pabeigta.");

  await db.transaction(async (tx) => {
    await tx.update(instanceSettings).set({
      legalEntityName: clean(input.legalEntityName),
      legalRegistrationNumber: clean(input.legalRegistrationNumber),
      legalAddress: clean(input.legalAddress),
      legalCountry: clean(input.legalCountry),
      legalEmail: clean(input.legalEmail),
      legalPhone: clean(input.legalPhone),
      privacyContactEmail: clean(input.privacyContactEmail),
      dataRetentionMonths: input.dataRetentionMonths,
      updatedAt: new Date(),
    }).where(eq(instanceSettings.id, settings.id));
    await writeAudit(tx, {
      actorUserId: actor.id,
      action: "instance.legal_settings_updated",
      objectType: "instance",
      objectId: settings.id,
      details: { dataRetentionMonths: input.dataRetentionMonths },
      ipAddress: audit.ipAddress,
      requestId: audit.requestId,
    });
  });
}

function clean(value: string) {
  return value.trim() || null;
}
