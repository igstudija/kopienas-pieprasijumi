import "server-only";

import { and, eq, gt, isNull, lt, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { emailLoginChallenges, instanceSettings, sessions, users } from "@/lib/db/schema";
import { HttpError } from "@/lib/http";
import type { Locale } from "@/lib/i18n";
import { magicLinkEmail } from "@/lib/magic-link-email";
import { sendEmail } from "@/lib/mailer";
import {
  emailLoginAddressDigest,
  emailLoginTokenDigest,
  generateToken,
  normalizeEmail,
  sessionDigest,
} from "@/lib/security";
import { writeAudit } from "./audit";
import { getEmailTransport } from "./email-settings";

const MAGIC_LINK_TTL_MS = 10 * 60 * 1000;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const CHALLENGE_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_EMAIL_ATTEMPTS = 5;
const MAX_IP_ATTEMPTS = 20;
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

type Context = {
  ipAddress?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
};

export async function requestEmailMagicLink(emailInput: string, locale: Locale, context: Context) {
  const email = normalizeEmail(emailInput);
  const emailDigest = emailLoginAddressDigest(email);
  const ipAddress = context.ipAddress?.slice(0, 64) || "unknown";
  const db = getDb();
  const transport = await getEmailTransport();
  const since = new Date(Date.now() - ATTEMPT_WINDOW_MS);

  await db.delete(emailLoginChallenges).where(lt(emailLoginChallenges.createdAt, new Date(Date.now() - CHALLENGE_RETENTION_MS)));
  const recentIp = await db
    .select({ id: emailLoginChallenges.id })
    .from(emailLoginChallenges)
    .where(and(eq(emailLoginChallenges.requestedIp, ipAddress), gt(emailLoginChallenges.createdAt, since)))
    .limit(MAX_IP_ATTEMPTS);
  if (recentIp.length >= MAX_IP_ATTEMPTS) {
    await writeAudit(db, {
      action: "auth.email_magic_link_rate_limited",
      objectType: "authentication",
      details: { scope: "ip" },
      ipAddress: context.ipAddress,
      requestId: context.requestId,
    });
    throw new HttpError(429, "Pārāk daudz autorizācijas pieprasījumu. Mēģini vēlreiz pēc 15 minūtēm.");
  }

  const candidates = await db
    .select()
    .from(users)
    .where(and(
      sql`lower(${users.email}) = ${email}`,
      eq(users.status, "active"),
    ))
    .limit(2);
  if (candidates.length !== 1) {
    await writeAudit(db, {
      action: "auth.email_magic_link_not_sent",
      objectType: "authentication",
      details: { reason: candidates.length > 1 ? "ambiguous_email" : "unknown_email" },
      ipAddress: context.ipAddress,
      requestId: context.requestId,
    });
    return;
  }

  const user = candidates[0]!;
  const recentEmail = await db
    .select({ id: emailLoginChallenges.id })
    .from(emailLoginChallenges)
    .where(and(eq(emailLoginChallenges.emailDigest, emailDigest), gt(emailLoginChallenges.createdAt, since)))
    .limit(MAX_EMAIL_ATTEMPTS);
  if (recentEmail.length >= MAX_EMAIL_ATTEMPTS) {
    await writeAudit(db, {
      actorUserId: user.id,
      action: "auth.email_magic_link_rate_limited",
      objectType: "authentication",
      details: { scope: "email" },
      ipAddress: context.ipAddress,
      requestId: context.requestId,
    });
    return;
  }

  const token = generateToken(32);
  const id = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + MAGIC_LINK_TTL_MS);
  const [settings] = await db.select({ name: instanceSettings.name, baseUrl: instanceSettings.baseUrl }).from(instanceSettings).limit(1);
  if (!settings) throw new HttpError(503, "Instalācija nav pabeigta.");
  const link = `${settings.baseUrl.replace(/\/$/, "")}/#login_token=${token}`;

  await db.transaction(async (tx) => {
    await tx
      .update(emailLoginChallenges)
      .set({ consumedAt: new Date() })
      .where(and(eq(emailLoginChallenges.userId, user.id), isNull(emailLoginChallenges.consumedAt)));
    await tx.insert(emailLoginChallenges).values({
      id,
      tokenDigest: emailLoginTokenDigest(token),
      emailDigest,
      userId: user.id,
      expiresAt,
      requestedIp: ipAddress,
      userAgent: context.userAgent ?? null,
    });
  });

  try {
    await sendEmail(transport, { to: email, ...magicLinkEmail(locale, settings.name, link) });
    await writeAudit(db, {
      actorUserId: user.id,
      action: "auth.email_magic_link_sent",
      objectType: "auth_challenge",
      objectId: id,
      ipAddress: context.ipAddress,
      requestId: context.requestId,
    });
  } catch {
    await db.delete(emailLoginChallenges).where(eq(emailLoginChallenges.id, id));
    await writeAudit(db, {
      actorUserId: user.id,
      action: "auth.email_magic_link_delivery_failed",
      objectType: "auth_challenge",
      objectId: id,
      ipAddress: context.ipAddress,
      requestId: context.requestId,
    });
  }
}

export async function confirmEmailMagicLink(token: string, context: Context) {
  const db = getDb();
  const [challenge] = await db
    .select()
    .from(emailLoginChallenges)
    .where(and(
      eq(emailLoginChallenges.tokenDigest, emailLoginTokenDigest(token)),
      gt(emailLoginChallenges.expiresAt, new Date()),
      isNull(emailLoginChallenges.consumedAt),
    ))
    .limit(1);
  if (!challenge) throw new HttpError(400, "Ieiešanas saite nav derīga vai tās termiņš ir beidzies.");
  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.id, challenge.userId), eq(users.status, "active")))
    .limit(1);
  if (!user) throw new HttpError(400, "Ieiešanas saite nav derīga vai tās termiņš ir beidzies.");

  const rawSessionToken = generateToken(32);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.transaction(async (tx) => {
    const consumed = await tx
      .update(emailLoginChallenges)
      .set({ consumedAt: new Date() })
      .where(and(
        eq(emailLoginChallenges.id, challenge.id),
        gt(emailLoginChallenges.expiresAt, new Date()),
        isNull(emailLoginChallenges.consumedAt),
      ))
      .returning({ id: emailLoginChallenges.id });
    if (!consumed.length) throw new HttpError(400, "Ieiešanas saite jau ir izmantota.");
    await tx.insert(sessions).values({
      userId: user.id,
      tokenDigest: sessionDigest(rawSessionToken),
      expiresAt,
      ipAddress: context.ipAddress ?? null,
      userAgent: context.userAgent ?? null,
    });
    await tx.update(users).set({ lastLoginAt: new Date(), updatedAt: new Date() }).where(eq(users.id, user.id));
    await writeAudit(tx, {
      actorUserId: user.id,
      action: "auth.email_magic_link_login_succeeded",
      objectType: "user",
      objectId: user.id,
      ipAddress: context.ipAddress,
      requestId: context.requestId,
    });
  });
  return { rawSessionToken, expiresAt };
}
