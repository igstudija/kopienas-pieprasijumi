import "server-only";

import { and, asc, eq, inArray, ne } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { sessions, type User, users, whatsappLoginChallenges } from "@/lib/db/schema";
import { decryptPhone, encryptPhone, normalizePhone, phoneLookup } from "@/lib/security";
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

export type ImportUserInput = {
  rowNumber: number;
  firstName: string;
  lastName: string;
  company: string;
  category?: string | null;
  phone: string;
  email?: string | null;
};

export type UpdateUserProfileInput = {
  firstName: string;
  lastName: string;
  company: string;
  category?: string | null;
  email?: string | null;
  phone?: string | null;
  role?: "admin" | "member";
  password?: string | null;
};

export async function listUsers() {
  return getDb()
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      displayName: users.displayName,
      company: users.company,
      category: users.category,
      email: users.email,
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

export async function getOwnProfile(userId: string) {
  const [user] = await getDb().select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user || user.status === "archived") throw new HttpError(404, "Lietotājs nav atrasts.");
  return {
    firstName: user.firstName,
    lastName: user.lastName,
    displayName: user.displayName,
    company: user.company,
    category: user.category,
    email: user.email,
    phone: decryptPhone(user.phoneEncrypted),
    role: user.role,
  };
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

export async function importUsers(actor: User, rows: ImportUserInput[], audit: AuditMeta) {
  assertAdministrator(actor);
  if (rows.length > 500) throw new HttpError(400, "Vienā reizē var importēt ne vairāk kā 500 biedrus.");

  const errors: Array<{ row: number; message: string }> = [];
  const seenLookups = new Set<string>();
  const candidates: Array<{
    rowNumber: number;
    firstName: string;
    lastName: string;
    company: string;
    category: string | null;
    email: string | null;
    phone: string;
    lookup: string;
  }> = [];

  for (const row of rows) {
    const firstName = row.firstName.trim();
    const lastName = row.lastName.trim();
    const company = row.company.trim();
    const category = row.category?.trim() || null;
    const email = row.email?.trim().toLowerCase() || null;
    if (firstName.length < 2) { errors.push({ row: row.rowNumber, message: "Nav norādīts korekts vārds." }); continue; }
    if (lastName.length < 2) { errors.push({ row: row.rowNumber, message: "Nav norādīts korekts uzvārds." }); continue; }
    if (company.length < 2) { errors.push({ row: row.rowNumber, message: "Nav norādīts uzņēmums." }); continue; }
    if (firstName.length > 100 || lastName.length > 100 || company.length > 180 || (category?.length ?? 0) > 180) {
      errors.push({ row: row.rowNumber, message: "Kāds teksta lauks ir pārāk garš." });
      continue;
    }
    if (email && (email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
      errors.push({ row: row.rowNumber, message: "E-pasta adrese nav korekta." });
      continue;
    }
    let phone: string;
    try {
      phone = normalizePhone(row.phone);
    } catch {
      errors.push({ row: row.rowNumber, message: "Tālruņa numurs nav korekts." });
      continue;
    }
    const lookup = phoneLookup(phone);
    if (seenLookups.has(lookup)) {
      errors.push({ row: row.rowNumber, message: "Šis tālruņa numurs failā atkārtojas." });
      continue;
    }
    seenLookups.add(lookup);
    candidates.push({ rowNumber: row.rowNumber, firstName, lastName, company, category, email, phone, lookup });
  }

  const existingRows = candidates.length
    ? await getDb().select({ phoneLookup: users.phoneLookup }).from(users).where(inArray(users.phoneLookup, candidates.map((row) => row.lookup)))
    : [];
  const existingLookups = new Set(existingRows.map((row) => row.phoneLookup));
  const importable = candidates.filter((row) => {
    if (!existingLookups.has(row.lookup)) return true;
    errors.push({ row: row.rowNumber, message: "Biedrs ar šo tālruņa numuru jau eksistē." });
    return false;
  });

  if (importable.length) {
    const db = getDb();
    await db.transaction(async (tx) => {
      await tx.insert(users).values(importable.map((row) => ({
        id: crypto.randomUUID(),
        firstName: row.firstName,
        lastName: row.lastName,
        displayName: `${row.firstName} ${row.lastName}`,
        company: row.company,
        category: row.category,
        email: row.email,
        phoneEncrypted: encryptPhone(row.phone),
        phoneLookup: row.lookup,
        phoneLast4: row.phone.slice(-4),
        passwordHash: null,
        role: "member" as const,
        status: "active" as const,
      })));
      await writeAudit(tx, {
        actorUserId: actor.id,
        action: "users.imported",
        objectType: "user_import",
        details: { imported: importable.length, skipped: errors.length },
        ipAddress: audit.ipAddress,
        requestId: audit.requestId,
      });
    });
  }

  return { imported: importable.length, errors: errors.sort((left, right) => left.row - right.row) };
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

export async function updateUserProfile(actor: User, userId: string, input: UpdateUserProfileInput, audit: AuditMeta) {
  const db = getDb();
  const [target] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const isSelf = actor.id === userId;
  if (!isSelf) {
    assertAdministrator(actor);
    assertManageableTarget(actor, target);
  } else if (!target || target.status === "archived") {
    throw new HttpError(404, "Lietotājs nav atrasts.");
  }

  const nextRole = input.role ?? target.role;
  if (input.role && input.role !== target.role) {
    if (isSelf) throw new HttpError(400, "Savu lomu mainīt nevar.");
    if (actor.role !== "owner") throw new HttpError(403, "Tikai Owner var mainīt administratoru lomas.");
    if (target.role === "owner") throw new HttpError(400, "Owner lomu mainīt nevar.");
  }
  if (input.password && input.password.length < 12) throw new HttpError(400, "Parolei jābūt vismaz 12 rakstzīmes garai.");
  if (nextRole === "admin" && !target.passwordHash && !input.password) {
    throw new HttpError(400, "Jaunam administratoram jānorāda vismaz 12 rakstzīmju parole.");
  }

  const phone = input.phone?.trim() ? normalizePhone(input.phone) : null;
  const lookup = phone ? phoneLookup(phone) : null;
  if (lookup && lookup !== target.phoneLookup) {
    const [conflict] = await db.select({ id: users.id }).from(users).where(and(eq(users.phoneLookup, lookup), ne(users.id, userId))).limit(1);
    if (conflict) throw new HttpError(409, "Šis tālruņa numurs jau ir reģistrēts citam lietotājam.");
  }

  const passwordHash = nextRole === "member"
    ? null
    : input.password
      ? await hashPassword(input.password)
      : target.passwordHash;
  const phoneChanged = Boolean(phone && lookup !== target.phoneLookup);
  const roleChanged = nextRole !== target.role;
  await db.transaction(async (tx) => {
    await tx.update(users).set({
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      displayName: `${input.firstName} ${input.lastName}`.trim(),
      company: input.company.trim(),
      category: input.category?.trim() || null,
      email: input.email?.trim().toLowerCase() || null,
      ...(phone ? { phoneEncrypted: encryptPhone(phone), phoneLookup: lookup!, phoneLast4: phone.slice(-4) } : {}),
      role: nextRole,
      passwordHash,
      updatedAt: new Date(),
    }).where(eq(users.id, userId));
    if (!isSelf && (phoneChanged || roleChanged)) {
      await tx.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.userId, userId));
    }
    await writeAudit(tx, {
      actorUserId: actor.id,
      action: isSelf ? "user.profile_updated" : "user.updated",
      objectType: "user",
      objectId: userId,
      details: { phoneChanged, roleChanged, nextRole },
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
