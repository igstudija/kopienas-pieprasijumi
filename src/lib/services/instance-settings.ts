import "server-only";

import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { instanceSettings, type User } from "@/lib/db/schema";
import { HttpError } from "@/lib/http";
import { parseLocale, type Locale } from "@/lib/i18n";
import { writeAudit } from "./audit";

type AuditMeta = { ipAddress?: string | null; requestId?: string | null };

export type GeneralInstanceSettings = {
  locale: Locale;
};

export async function getInstanceLocale(): Promise<Locale> {
  try {
    const [settings] = await getDb()
      .select({ locale: instanceSettings.locale })
      .from(instanceSettings)
      .limit(1);
    return parseLocale(settings?.locale);
  } catch {
    return "lv";
  }
}

export async function getGeneralInstanceSettings(): Promise<GeneralInstanceSettings> {
  const [settings] = await getDb()
    .select({ locale: instanceSettings.locale })
    .from(instanceSettings)
    .limit(1);
  if (!settings) throw new HttpError(409, "Installation is not complete.");
  return { locale: parseLocale(settings.locale) };
}

export async function updateGeneralInstanceSettings(
  actor: User,
  input: GeneralInstanceSettings,
  audit: AuditMeta,
) {
  if (actor.role === "member") throw new HttpError(403, "Insufficient permissions.");
  const db = getDb();
  const [settings] = await db.select({ id: instanceSettings.id }).from(instanceSettings).limit(1);
  if (!settings) throw new HttpError(409, "Installation is not complete.");

  await db.transaction(async (tx) => {
    await tx.update(instanceSettings).set({
      locale: input.locale,
      updatedAt: new Date(),
    }).where(eq(instanceSettings.id, settings.id));
    await writeAudit(tx, {
      actorUserId: actor.id,
      action: "instance.general_settings_updated",
      objectType: "instance",
      objectId: settings.id,
      details: { locale: input.locale },
      ipAddress: audit.ipAddress,
      requestId: audit.requestId,
    });
  });

  return getGeneralInstanceSettings();
}
