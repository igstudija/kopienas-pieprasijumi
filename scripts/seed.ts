import { eq } from "drizzle-orm";
import { getDb } from "../src/lib/db/client";
import { instanceSettings, users } from "../src/lib/db/schema";
import { appUrl, instanceId } from "../src/lib/env";
import { hashPassword } from "../src/lib/password";
import { encryptPhone, normalizePhone, phoneLookup } from "../src/lib/security";

const phone = normalizePhone(process.env.SEED_OWNER_PHONE ?? "+37120000000");
const firstName = process.env.SEED_OWNER_FIRST_NAME ?? "Sistēmas";
const lastName = process.env.SEED_OWNER_LAST_NAME ?? "Īpašnieks";
const ownerPassword = process.env.SEED_OWNER_PASSWORD
  ?? (process.env.NODE_ENV === "production" ? null : "development-admin");
if (!ownerPassword || ownerPassword.length < 12) {
  throw new Error("SEED_OWNER_PASSWORD jābūt vismaz 12 rakstzīmes garai.");
}
const passwordHash = await hashPassword(ownerPassword);
const db = getDb();

await db.insert(instanceSettings).values({
  id: instanceId(),
  name: process.env.INSTANCE_NAME ?? "Uzņēmēju kopiena",
  baseUrl: appUrl(),
  federationPublicKey: process.env.FEDERATION_PUBLIC_KEY || null,
  federationKeyId: process.env.FEDERATION_KEY_ID || null,
}).onConflictDoNothing();

const lookup = phoneLookup(phone);
const existing = await db.select({ id: users.id }).from(users).where(eq(users.phoneLookup, lookup)).limit(1);
if (existing.length) {
  await db.update(users).set({
    passwordHash,
    role: "owner",
    status: "active",
    updatedAt: new Date(),
  }).where(eq(users.id, existing[0].id));
  console.log("Owner ar šo tālruņa numuru jau eksistē; admina parole atjaunināta.");
} else {
  const owners = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.role, "owner"))
    .limit(2);

  if (owners.length === 1) {
    await db.update(users).set({
      firstName,
      lastName,
      displayName: `${firstName} ${lastName}`,
      company: process.env.SEED_OWNER_COMPANY ?? "Kopienas administrācija",
      phoneEncrypted: encryptPhone(phone),
      phoneLookup: lookup,
      phoneLast4: phone.slice(-4),
      passwordHash,
      role: "owner",
      status: "active",
      updatedAt: new Date(),
    }).where(eq(users.id, owners[0].id));
    console.log(`Esošā owner tālruņa numurs un admina parole atjaunināti: •••• ${phone.slice(-4)}`);
  } else if (owners.length > 1) {
    throw new Error(
      "SEED_OWNER_PHONE neatbilst nevienam lietotājam, bet datubāzē ir vairāki owner. Norādi esoša owner tālruņa numuru.",
    );
  } else {
    await db.insert(users).values({
      firstName,
      lastName,
      displayName: `${firstName} ${lastName}`,
      company: process.env.SEED_OWNER_COMPANY ?? "Kopienas administrācija",
      phoneEncrypted: encryptPhone(phone),
      phoneLookup: lookup,
      phoneLast4: phone.slice(-4),
      passwordHash,
      role: "owner",
      status: "active",
    });
    console.log(`Owner izveidots: ${firstName} ${lastName}, •••• ${phone.slice(-4)}`);
  }
}

process.exit(0);
