import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { and, eq, gt, isNull, lt } from "drizzle-orm";
import QRCode from "qrcode";
import { getDb } from "@/lib/db";
import { sessions, users, whatsappLoginChallenges } from "@/lib/db/schema";
import { HttpError } from "@/lib/http";
import { generateToken, normalizePhone, phoneLookup, sessionDigest, whatsappBrowserTokenDigest, whatsappMessageTokenDigest } from "@/lib/security";
import { writeAudit } from "./audit";
import { getInstanceRuntime } from "./installation";

const QR_TTL_MS = 2 * 60 * 1000;
const QR_RATE_WINDOW_MS = 5 * 60 * 1000;
const QR_RATE_LIMIT = 10;
const QR_UNKNOWN_IP_RATE_LIMIT = 100;
const QR_RETENTION_MS = 24 * 60 * 60 * 1000;
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const LOGIN_PREFIX = "PIETEIKTIES";
type Context = { ipAddress?: string | null; userAgent?: string | null; requestId?: string | null };

export async function startWhatsappQrLogin(context: Context) {
  const businessNumber = (await getInstanceRuntime()).whatsappBusinessNumber;
  if (!businessNumber) throw new Error("WHATSAPP_BUSINESS_NUMBER nav konfigurēts.");
  const db = getDb();
  const requestedIp = context.ipAddress?.slice(0, 64) ?? null;
  const rateLimit = requestedIp ? QR_RATE_LIMIT : QR_UNKNOWN_IP_RATE_LIMIT;
  await db.delete(whatsappLoginChallenges).where(lt(whatsappLoginChallenges.expiresAt, new Date(Date.now() - QR_RETENTION_MS)));
  const recentChallenges = await db
    .select({ id: whatsappLoginChallenges.id })
    .from(whatsappLoginChallenges)
    .where(and(
      requestedIp ? eq(whatsappLoginChallenges.requestedIp, requestedIp) : isNull(whatsappLoginChallenges.requestedIp),
      gt(whatsappLoginChallenges.createdAt, new Date(Date.now() - QR_RATE_WINDOW_MS)),
    ))
    .limit(rateLimit);
  if (recentChallenges.length >= rateLimit) {
    await writeAudit(db, { action: "auth.whatsapp_qr_rate_limited", objectType: "authentication", ipAddress: context.ipAddress, requestId: context.requestId });
    throw new HttpError(429, "Pārāk daudz autorizācijas mēģinājumu. Mēģini vēlreiz pēc piecām minūtēm.");
  }
  const id = crypto.randomUUID();
  const messageToken = generateToken(18);
  const browserToken = generateToken(32);
  const expiresAt = new Date(Date.now() + QR_TTL_MS);
  const text = `${LOGIN_PREFIX} ${messageToken}`;
  const deepLink = `https://wa.me/${businessNumber.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
  await db.insert(whatsappLoginChallenges).values({
    id,
    messageTokenDigest: whatsappMessageTokenDigest(messageToken),
    browserTokenDigest: whatsappBrowserTokenDigest(browserToken),
    expiresAt,
    requestedIp,
    userAgent: context.userAgent ?? null,
  });
  return {
    challengeId: id,
    browserToken,
    deepLink,
    qrDataUrl: await QRCode.toDataURL(deepLink, { width: 320, margin: 2, errorCorrectionLevel: "M", color: { dark: "#12372a", light: "#fbf9f3" } }),
    expiresAt,
  };
}

export async function registerWhatsappLoginMessage(from: string, text: string) {
  const match = text.trim().match(/^PIETEIKTIES\s+([A-Za-z0-9_-]{20,40})$/i);
  if (!match) return { matched: false };
  const db = getDb();
  const tokenDigest = whatsappMessageTokenDigest(match[1]);
  const [challenge] = await db
    .select()
    .from(whatsappLoginChallenges)
    .where(and(eq(whatsappLoginChallenges.messageTokenDigest, tokenDigest), gt(whatsappLoginChallenges.expiresAt, new Date()), isNull(whatsappLoginChallenges.completedAt), isNull(whatsappLoginChallenges.consumedAt)))
    .limit(1);
  if (!challenge) return { matched: true, accepted: false };
  let phone: string;
  try { phone = normalizePhone(from.startsWith("+") ? from : `+${from}`); } catch { return { matched: true, accepted: false }; }
  const [user] = await db.select().from(users).where(and(eq(users.phoneLookup, phoneLookup(phone)), eq(users.status, "active"))).limit(1);
  if (!user) return { matched: true, accepted: false };
  await db.transaction(async (tx) => {
    await tx.update(whatsappLoginChallenges).set({ userId: user.id, completedAt: new Date() }).where(eq(whatsappLoginChallenges.id, challenge.id));
    await writeAudit(tx, { actorUserId: user.id, action: "auth.whatsapp_qr_confirmed", objectType: "auth_challenge", objectId: challenge.id });
  });
  return { matched: true, accepted: true };
}

export async function pollWhatsappQrLogin(challengeId: string, browserToken: string, context: Context) {
  const db = getDb();
  const [challenge] = await db
    .select()
    .from(whatsappLoginChallenges)
    .where(and(eq(whatsappLoginChallenges.id, challengeId), eq(whatsappLoginChallenges.browserTokenDigest, whatsappBrowserTokenDigest(browserToken))))
    .limit(1);
  if (!challenge || challenge.consumedAt) return { status: "invalid" as const };
  if (challenge.expiresAt <= new Date()) return { status: "expired" as const };
  if (!challenge.completedAt || !challenge.userId) return { status: "pending" as const };
  const [user] = await db.select().from(users).where(and(eq(users.id, challenge.userId), eq(users.status, "active"))).limit(1);
  if (!user) return { status: "invalid" as const };
  const rawSessionToken = generateToken(32);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.transaction(async (tx) => {
    const consumed = await tx
      .update(whatsappLoginChallenges)
      .set({ consumedAt: new Date() })
      .where(and(eq(whatsappLoginChallenges.id, challenge.id), isNull(whatsappLoginChallenges.consumedAt)))
      .returning({ id: whatsappLoginChallenges.id });
    if (!consumed.length) throw new Error("QR challenge jau izmantots.");
    await tx.insert(sessions).values({ userId: user.id, tokenDigest: sessionDigest(rawSessionToken), expiresAt, ipAddress: context.ipAddress ?? null, userAgent: context.userAgent ?? null });
    await tx.update(users).set({ lastLoginAt: new Date(), updatedAt: new Date() }).where(eq(users.id, user.id));
    await writeAudit(tx, { actorUserId: user.id, action: "auth.whatsapp_qr_login_succeeded", objectType: "user", objectId: user.id, ipAddress: context.ipAddress, requestId: context.requestId });
  });
  return { status: "complete" as const, rawSessionToken, expiresAt };
}

export async function verifyWhatsappWebhookSignature(rawBody: string, header: string | null) {
  const secret = (await getInstanceRuntime()).whatsappAppSecret;
  if (!secret) {
    if (process.env.NODE_ENV === "production") return false;
    return true;
  }
  if (!header?.startsWith("sha256=")) return false;
  const expected = Buffer.from(createHmac("sha256", secret).update(rawBody).digest("hex"), "hex");
  const received = Buffer.from(header.slice(7), "hex");
  return expected.length === received.length && timingSafeEqual(expected, received);
}
