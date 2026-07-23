import "server-only";

import { and, asc, eq, inArray, ne, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { emailLoginChallenges, sessions, type User, users } from "@/lib/db/schema";
import { decryptPhone, encryptPhone, normalizeEmail, normalizePhone, phoneLookup } from "@/lib/security";
import { HttpError } from "@/lib/http";
import { writeAudit } from "./audit";

export type NewUserInput = {
  firstName: string;
  lastName: string;
  company: string;
  category?: string | null;
  phone: string;
  email: string;
  role?: "owner" | "admin" | "member";
};

type AuditMeta = { ipAddress?: string | null; requestId?: string | null };

export type ImportUserInput = {
  rowNumber: number;
  firstName: string;
  lastName: string;
  company: string;
  category?: string | null;
  phone: string;
  email: string;
};

export type UpdateUserProfileInput = {
  firstName: string;
  lastName: string;
  company: string;
  category?: string | null;
  email: string;
  phone?: string | null;
  role?: "admin" | "member";
};

export async function listUsers() {
  const rows = await getDb()
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      displayName: users.displayName,
      company: users.company,
      category: users.category,
      email: users.email,
      phoneEncrypted: users.phoneEncrypted,
      role: users.role,
      status: users.status,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(ne(users.status, "archived"))
    .orderBy(asc(users.displayName));
  return rows.map(({ phoneEncrypted, ...user }) => ({
    ...user,
    phone: decryptPhone(phoneEncrypted),
  }));
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
  assertAdministrator(actor);
  if (input.role === "owner" && actor.role !== "owner") throw new HttpError(403, "Tikai Owner var piešķirt Owner lomu.");

  const role = input.role ?? "member";
  const phone = normalizePhone(input.phone);
  const lookup = phoneLookup(phone);
  const email = normalizeEmail(input.email);
  const db = getDb();
  await assertContactAvailable(email, lookup);

  const id = crypto.randomUUID();
  await db.transaction(async (tx) => {
    await tx.insert(users).values({
      id,
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      displayName: `${input.firstName} ${input.lastName}`.trim(),
      company: input.company.trim(),
      category: input.category?.trim() || null,
      email,
      phoneEncrypted: encryptPhone(phone),
      phoneLookup: lookup,
      phoneLast4: phone.slice(-4),
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
  const seenEmails = new Set<string>();
  const candidates: Array<{
    rowNumber: number;
    firstName: string;
    lastName: string;
    company: string;
    category: string | null;
    email: string;
    phone: string;
    lookup: string;
  }> = [];

  for (const row of rows) {
    const firstName = row.firstName.trim();
    const lastName = row.lastName.trim();
    const company = row.company.trim();
    const category = row.category?.trim() || null;
    if (firstName.length < 2) { errors.push({ row: row.rowNumber, message: "Nav norādīts korekts vārds." }); continue; }
    if (lastName.length < 2) { errors.push({ row: row.rowNumber, message: "Nav norādīts korekts uzvārds." }); continue; }
    if (company.length < 2) { errors.push({ row: row.rowNumber, message: "Nav norādīts uzņēmums." }); continue; }
    if (firstName.length > 100 || lastName.length > 100 || company.length > 180 || (category?.length ?? 0) > 180) {
      errors.push({ row: row.rowNumber, message: "Kāds teksta lauks ir pārāk garš." });
      continue;
    }

    let email: string;
    let phone: string;
    try {
      email = normalizeEmail(row.email);
    } catch {
      errors.push({ row: row.rowNumber, message: "E-pasta adrese nav korekta." });
      continue;
    }
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
    if (seenEmails.has(email)) {
      errors.push({ row: row.rowNumber, message: "Šī e-pasta adrese failā atkārtojas." });
      continue;
    }
    seenLookups.add(lookup);
    seenEmails.add(email);
    candidates.push({ rowNumber: row.rowNumber, firstName, lastName, company, category, email, phone, lookup });
  }

  const db = getDb();
  const existingPhones = candidates.length
    ? await db.select({ phoneLookup: users.phoneLookup }).from(users).where(inArray(users.phoneLookup, candidates.map((row) => row.lookup)))
    : [];
  const existingEmails = candidates.length
    ? await db.select({ email: users.email }).from(users).where(ne(users.status, "archived"))
    : [];
  const phoneSet = new Set(existingPhones.map((row) => row.phoneLookup));
  const emailSet = new Set(existingEmails.map((row) => row.email.toLowerCase()));
  const importable = candidates.filter((row) => {
    if (phoneSet.has(row.lookup)) {
      errors.push({ row: row.rowNumber, message: "Biedrs ar šo tālruņa numuru jau eksistē." });
      return false;
    }
    if (emailSet.has(row.email)) {
      errors.push({ row: row.rowNumber, message: "Biedrs ar šo e-pasta adresi jau eksistē." });
      return false;
    }
    return true;
  });

  if (importable.length) {
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
  await assertPhoneAvailable(lookup, userId);

  await db.transaction(async (tx) => {
    await tx.update(users).set({
      phoneEncrypted: encryptPhone(phone),
      phoneLookup: lookup,
      phoneLast4: phone.slice(-4),
      updatedAt: new Date(),
    }).where(eq(users.id, userId));
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

  const email = normalizeEmail(input.email);
  const phone = input.phone?.trim() ? normalizePhone(input.phone) : null;
  const lookup = phone ? phoneLookup(phone) : target.phoneLookup;
  if (email !== target.email.toLowerCase()) await assertEmailAvailable(email, userId);
  if (lookup !== target.phoneLookup) await assertPhoneAvailable(lookup, userId);

  const emailChanged = email !== target.email.toLowerCase();
  const phoneChanged = lookup !== target.phoneLookup;
  const roleChanged = nextRole !== target.role;
  await db.transaction(async (tx) => {
    await tx.update(users).set({
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      displayName: `${input.firstName} ${input.lastName}`.trim(),
      company: input.company.trim(),
      category: input.category?.trim() || null,
      email,
      ...(phone ? { phoneEncrypted: encryptPhone(phone), phoneLookup: lookup, phoneLast4: phone.slice(-4) } : {}),
      role: nextRole,
      updatedAt: new Date(),
    }).where(eq(users.id, userId));
    if (emailChanged || (!isSelf && roleChanged)) {
      await tx.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.userId, userId));
      await tx.delete(emailLoginChallenges).where(eq(emailLoginChallenges.userId, userId));
    }
    await writeAudit(tx, {
      actorUserId: actor.id,
      action: isSelf ? "user.profile_updated" : "user.updated",
      objectType: "user",
      objectId: userId,
      details: { emailChanged, phoneChanged, roleChanged, nextRole },
      ipAddress: audit.ipAddress,
      requestId: audit.requestId,
    });
  });
}

export async function setUserStatus(actor: User, userId: string, status: "active" | "suspended", audit: AuditMeta) {
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
      await tx.delete(emailLoginChallenges).where(eq(emailLoginChallenges.userId, userId));
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
    await tx.delete(emailLoginChallenges).where(eq(emailLoginChallenges.userId, userId));
    await tx.update(users).set({
      firstName: "Dzēsts",
      lastName: "lietotājs",
      displayName: "Dzēsts lietotājs",
      company: "—",
      category: null,
      email: `${userId}@deleted.invalid`,
      phoneEncrypted: encryptPhone(tombstone),
      phoneLookup: phoneLookup(tombstone),
      phoneLast4: "----",
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

async function assertContactAvailable(email: string, phone: string, exceptUserId?: string) {
  await Promise.all([assertEmailAvailable(email, exceptUserId), assertPhoneAvailable(phone, exceptUserId)]);
}

async function assertEmailAvailable(email: string, exceptUserId?: string) {
  const conditions = [sql`lower(${users.email}) = ${email}`, ne(users.status, "archived")];
  if (exceptUserId) conditions.push(ne(users.id, exceptUserId));
  const [conflict] = await getDb().select({ id: users.id }).from(users).where(and(...conditions)).limit(1);
  if (conflict) throw new HttpError(409, "Šī e-pasta adrese jau ir reģistrēta citam lietotājam.");
}

async function assertPhoneAvailable(lookup: string, exceptUserId?: string) {
  const conditions = [eq(users.phoneLookup, lookup)];
  if (exceptUserId) conditions.push(ne(users.id, exceptUserId));
  const [conflict] = await getDb().select({ id: users.id }).from(users).where(and(...conditions)).limit(1);
  if (conflict) throw new HttpError(409, "Šis tālruņa numurs jau ir reģistrēts citam lietotājam.");
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
