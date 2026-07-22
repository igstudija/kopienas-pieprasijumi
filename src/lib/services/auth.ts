import "server-only";

import { and, desc, eq, gt, isNull } from "drizzle-orm";
import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { sessions, users } from "@/lib/db/schema";
import { sessionDigest } from "@/lib/security";
import { writeAudit } from "./audit";

export const SESSION_COOKIE = "community_session";
type RequestContext = { ipAddress?: string | null; userAgent?: string | null; requestId?: string | null };

export function attachSessionCookie(response: NextResponse, rawToken: string, expiresAt: Date) {
  response.cookies.set(SESSION_COOKIE, rawToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function currentUserFromRequest(request: NextRequest) {
  return currentUserFromToken(request.cookies.get(SESSION_COOKIE)?.value);
}

export async function currentUserFromPage() {
  const store = await cookies();
  return currentUserFromToken(store.get(SESSION_COOKIE)?.value);
}

async function currentUserFromToken(rawToken?: string) {
  if (!rawToken) return null;
  const db = getDb();
  const [result] = await db
    .select({ user: users })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.tokenDigest, sessionDigest(rawToken)), isNull(sessions.revokedAt), gt(sessions.expiresAt, new Date()), eq(users.status, "active")))
    .orderBy(desc(sessions.createdAt))
    .limit(1);
  return result?.user ?? null;
}

export async function logout(request: NextRequest, context: RequestContext) {
  const rawToken = request.cookies.get(SESSION_COOKIE)?.value;
  if (!rawToken) return;
  const db = getDb();
  const digest = sessionDigest(rawToken);
  const [session] = await db.select().from(sessions).where(eq(sessions.tokenDigest, digest)).limit(1);
  await db.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.tokenDigest, digest));
  if (session) await writeAudit(db, { actorUserId: session.userId, action: "auth.logout", objectType: "session", objectId: session.id, ipAddress: context.ipAddress, requestId: context.requestId });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 0 });
}
