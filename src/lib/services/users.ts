import "server-only";

import { and, asc, eq, ne } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { sessions, type User, users, whatsappLoginChallenges } from "@/lib/db/schema";
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

type AuditMeta = { ipAddress?: string | null; requestId?: string | null };

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
    .where(ne(users.status, "archived"))
    .orderBy(asc(users.displayName));
}

export async function createUser(actor: User, input: NewUserInput, audit: AuditMeta) {
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

export async function updateUserPhone(actor: User, userId: string, inputPhone: string, audit: AuditMeta) {
  assertAdministrator(actor);
  const db = getDb();
  const [target] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  assertManageableTarget(actor, target);
  const phone = normalizePhone(inputPhone);
  const lookup = phoneLookup(phone);
  const [conflict] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.phoneLookup, lookup), ne(users.id, userId)))
    .limit(1);
  if (conflict) throw new HttpError(409, "Šis tālruņa numurs jau ir reģistrēts citam lietotājam.");

  await db.transaction(async (tx) => {
    await tx.update(users).set({
      phoneEncrypted: encryptPhone(phone),
      phoneLookup: lookup,
      phoneLast4: phone.slice(-4),
      updatedAt: new Date(),
    }).where(eq(users.id, userId));
    if (actor.id !== userId) {
      await tx.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.userId, userId));
    }
    await writeAudit(tx, {
      actorUserId: actor.id,
      action: "user.phone_updated",
      objectType: "user",
      objectId: userId,
      details: { phoneLast4: phone.slice(-4) },
      ipAddress: audit.ipAddress,
      requestId: audit.requestId,
    });
  });
}

export async function setUserStatus(
  actor: User,
  userId: string,
  status: "active" | "suspended",
  audit: AuditMeta,
) {
  assertAdministrator(actor);
  const db = getDb();
  const [target] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  assertManageableTarget(actor, target);
  if (target.role === "owner") throw new HttpError(400, "Owner kontu nevar deaktivizēt.");
  if (actor.id === userId) throw new HttpError(400, "Savu administratora kontu nevar deaktivizēt.");

  await db.transaction(async (tx) => {
    await tx.update(users).set({ status, updatedAt: new Date() }).where(eq(users.id, userId));
    if (status === "suspended") {
      await tx.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.userId, userId));
    }
    await writeAudit(tx, {
      actorUserId: actor.id,
      action: status === "active" ? "user.activated" : "user.suspended",
      objectType: "user",
      objectId: userId,
      ipAddress: audit.ipAddress,
      requestId: audit.requestId,
    });
  });
}

export async function deleteUser(actor: User, userId: string, audit: AuditMeta) {
  assertAdministrator(actor);
  const db = getDb();
  const [target] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  assertManageableTarget(actor, target);
  if (target.role === "owner") throw new HttpError(400, "Owner kontu nevar dzēst.");
  if (actor.id === userId) throw new HttpError(400, "Savu administratora kontu nevar dzēst.");

  const tombstone = `deleted:${userId}:${crypto.randomUUID()}`;
  await db.transaction(async (tx) => {
    await tx.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.userId, userId));
    await tx.delete(whatsappLoginChallenges).where(eq(whatsappLoginChallenges.userId, userId));
    await tx.update(users).set({
      firstName: "Dzēsts",
      lastName: "lietotājs",
      displayName: "Dzēsts lietotājs",
      company: "—",
      category: null,
      email: null,
      phoneEncrypted: encryptPhone(tombstone),
      phoneLookup: phoneLookup(tombstone),
      phoneLast4: "----",
      passwordHash: null,
      role: "member",
      status: "archived",
      lastLoginAt: null,
      updatedAt: new Date(),
    }).where(eq(users.id, userId));
    await writeAudit(tx, {
      actorUserId: actor.id,
      action: "user.deleted",
      objectType: "user",
      objectId: userId,
      details: { previousRole: target.role },
      ipAddress: audit.ipAddress,
      requestId: audit.requestId,
    });
  });
}

function assertAdministrator(actor: User) {
  if (actor.role === "member") throw new HttpError(403, "Nepietiekamas tiesības.");
}

function assertManageableTarget(actor: User, target: User | undefined): asserts target is User {
  if (!target || target.status === "archived") throw new HttpError(404, "Lietotājs nav atrasts.");
  if (target.role === "owner" && actor.role !== "owner") {
    throw new HttpError(403, "Administrators nevar mainīt Owner kontu.");
  }
}
