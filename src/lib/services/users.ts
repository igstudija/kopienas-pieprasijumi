import "server-only";

import { asc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { sessions, type User, users } from "@/lib/db/schema";
import { encryptPhone, normalizePhone, phoneLookup } from "@/lib/security";
import { HttpError } from "@/lib/http";
import { hashPassword } from "@/lib/password";
import { writeAudit } from "./audit";

export type NewUserInput = {
  firstName: string;
  lastName: string;
  company: string;
  category?: string | null;
  phone: string;
  email?: string | null;
  role?: "owner" | "admin" | "member";
  password?: string | null;
};

export async function listUsers() {
  return getDb()
    .select({
      id: users.id,
      displayName: users.displayName,
      company: users.company,
      category: users.category,
      phoneLast4: users.phoneLast4,
      role: users.role,
      status: users.status,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(asc(users.displayName));
}

export async function createUser(actor: User, input: NewUserInput, audit: { ipAddress?: string | null; requestId?: string | null }) {
  if (actor.role === "member") throw new HttpError(403, "Nepietiekamas tiesības.");
  if (input.role === "owner" && actor.role !== "owner") throw new HttpError(403, "Tikai Owner var piešķirt Owner lomu.");
  const role = input.role ?? "member";
  if (role !== "member" && (!input.password || input.password.length < 12)) {
    throw new HttpError(400, "Administratoram jānorāda vismaz 12 rakstzīmju parole.");
  }
  const phone = normalizePhone(input.phone);
  const passwordHash = role === "member" ? null : await hashPassword(input.password!);
  const db = getDb();
  const id = crypto.randomUUID();
  await db.transaction(async (tx) => {
    await tx.insert(users).values({
      id,
      firstName: input.firstName,
      lastName: input.lastName,
      displayName: `${input.firstName} ${input.lastName}`.trim(),
      company: input.company,
      category: input.category ?? null,
      email: input.email ?? null,
      phoneEncrypted: encryptPhone(phone),
      phoneLookup: phoneLookup(phone),
      phoneLast4: phone.slice(-4),
      passwordHash,
      role,
      status: "active",
    });
    await writeAudit(tx, {
      actorUserId: actor.id,
      action: "user.created",
      objectType: "user",
      objectId: id,
      details: { role },
      ipAddress: audit.ipAddress,
      requestId: audit.requestId,
    });
  });
  return id;
}

export async function suspendUser(actor: User, userId: string) {
  if (actor.role === "member") throw new HttpError(403, "Nepietiekamas tiesības.");
  const db = getDb();
  const [target] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!target) throw new HttpError(404, "Lietotājs nav atrasts.");
  if (target.role === "owner" && actor.role !== "owner") throw new HttpError(403, "Admin nevar apturēt Owner.");
  await db.transaction(async (tx) => {
    await tx.update(users).set({ status: "suspended", updatedAt: new Date() }).where(eq(users.id, userId));
    await tx.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.userId, userId));
    await writeAudit(tx, { actorUserId: actor.id, action: "user.suspended", objectType: "user", objectId: userId });
  });
}
