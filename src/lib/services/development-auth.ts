import "server-only";

import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { sessions, users } from "@/lib/db/schema";
import { HttpError } from "@/lib/http";
import { generateToken, normalizeEmail, sessionDigest } from "@/lib/security";
import { writeAudit } from "./audit";

const DEVELOPMENT_SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

type Context = {
  ipAddress?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
};

export function assertDevelopmentLoginAvailable(hostname: string) {
  if (process.env.NODE_ENV !== "development" || !LOCAL_HOSTS.has(hostname.toLowerCase())) {
    throw new HttpError(404, "Not found.");
  }
}

export async function createDevelopmentAdminSession(context: Context) {
  const db = getDb();
  const configuredEmail = process.env.DEV_ADMIN_EMAIL?.trim()
    || process.env.SEED_OWNER_EMAIL?.trim();

  const candidates = configuredEmail
    ? await db
        .select()
        .from(users)
        .where(and(
          sql`lower(${users.email}) = ${normalizeEmail(configuredEmail)}`,
          eq(users.status, "active"),
          inArray(users.role, ["owner", "admin"]),
        ))
        .limit(2)
    : await db
        .select()
        .from(users)
        .where(and(eq(users.status, "active"), inArray(users.role, ["owner", "admin"])))
        .orderBy(asc(users.createdAt))
        .limit(1);

  if (candidates.length !== 1) {
    throw new HttpError(
      409,
      "Set DEV_ADMIN_EMAIL to one active owner or administrator and run pnpm db:seed if the user does not exist.",
    );
  }

  const user = candidates[0]!;
  const rawSessionToken = generateToken(32);
  const expiresAt = new Date(Date.now() + DEVELOPMENT_SESSION_TTL_MS);

  await db.transaction(async (tx) => {
    await tx.insert(sessions).values({
      userId: user.id,
      tokenDigest: sessionDigest(rawSessionToken),
      expiresAt,
      ipAddress: context.ipAddress ?? null,
      userAgent: context.userAgent ?? null,
    });
    await tx.update(users).set({
      lastLoginAt: new Date(),
      updatedAt: new Date(),
    }).where(eq(users.id, user.id));
    await writeAudit(tx, {
      actorUserId: user.id,
      action: "auth.development_login_succeeded",
      objectType: "user",
      objectId: user.id,
      ipAddress: context.ipAddress,
      requestId: context.requestId,
    });
  });

  return { rawSessionToken, expiresAt };
}
