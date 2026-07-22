import "server-only";

import { and, eq, gt, lt, or } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { adminLoginAttempts, sessions, users } from "@/lib/db/schema";
import { HttpError } from "@/lib/http";
import { DUMMY_PASSWORD_HASH, verifyPassword } from "@/lib/password";
import { generateToken, normalizePhone, phoneLookup, sessionDigest, sha256 } from "@/lib/security";
import { writeAudit } from "./audit";

const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const ATTEMPT_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 5;
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const INVALID_CREDENTIALS = "Tālruņa numurs vai parole nav pareiza.";

type Context = {
  ipAddress?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
};

export async function loginAdminWithPassword(phoneInput: string, password: string, context: Context) {
  const db = getDb();
  const ipAddress = context.ipAddress?.slice(0, 64) || "unknown";
  let phone: string | null = null;
  let lookup = sha256(`invalid-admin-phone:${phoneInput.trim().toLowerCase()}`);
  try {
    phone = normalizePhone(phoneInput);
    lookup = phoneLookup(phone);
  } catch {
    // Invalid numbers use a non-reversible identifier and the same generic response.
  }

  await db.delete(adminLoginAttempts).where(lt(adminLoginAttempts.createdAt, new Date(Date.now() - ATTEMPT_RETENTION_MS)));
  const recentFailures = await db
    .select({ id: adminLoginAttempts.id })
    .from(adminLoginAttempts)
    .where(and(
      eq(adminLoginAttempts.phoneLookup, lookup),
      eq(adminLoginAttempts.ipAddress, ipAddress),
      eq(adminLoginAttempts.succeeded, false),
      gt(adminLoginAttempts.createdAt, new Date(Date.now() - ATTEMPT_WINDOW_MS)),
    ))
    .limit(MAX_FAILED_ATTEMPTS);

  if (recentFailures.length >= MAX_FAILED_ATTEMPTS) {
    await writeAudit(db, {
      action: "auth.admin_password_login_rate_limited",
      objectType: "authentication",
      details: { phoneLast4: phone?.slice(-4) ?? null },
      ipAddress: context.ipAddress,
      requestId: context.requestId,
    });
    throw new HttpError(429, "Pārāk daudz neveiksmīgu mēģinājumu. Mēģini vēlreiz pēc 15 minūtēm.");
  }

  const [user] = phone
    ? await db
      .select()
      .from(users)
      .where(and(
        eq(users.phoneLookup, lookup),
        eq(users.status, "active"),
        or(eq(users.role, "owner"), eq(users.role, "admin")),
      ))
      .limit(1)
    : [];
  const passwordMatches = await verifyPassword(password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);

  if (!user || !user.passwordHash || !passwordMatches) {
    await db.transaction(async (tx) => {
      await tx.insert(adminLoginAttempts).values({ phoneLookup: lookup, ipAddress, succeeded: false });
      await writeAudit(tx, {
        action: "auth.admin_password_login_failed",
        objectType: "authentication",
        details: { phoneLast4: phone?.slice(-4) ?? null },
        ipAddress: context.ipAddress,
        requestId: context.requestId,
      });
    });
    throw new HttpError(401, INVALID_CREDENTIALS);
  }

  const rawSessionToken = generateToken(32);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.transaction(async (tx) => {
    await tx.insert(adminLoginAttempts).values({ phoneLookup: lookup, ipAddress, succeeded: true });
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
      action: "auth.admin_password_login_succeeded",
      objectType: "user",
      objectId: user.id,
      ipAddress: context.ipAddress,
      requestId: context.requestId,
    });
  });

  return { rawSessionToken, expiresAt };
}
