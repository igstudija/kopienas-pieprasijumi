import { eq } from "drizzle-orm";
import { getDb } from "../src/lib/db/index";
import { instanceSettings, users } from "../src/lib/db/schema";
import { appUrl, instanceId } from "../src/lib/env";
import { encryptPhone, normalizePhone, phoneLookup } from "../src/lib/security";

const phone = normalizePhone(process.env.SEED_OWNER_PHONE ?? "+37120000000");
const firstName = process.env.SEED_OWNER_FIRST_NAME ?? "Sistēmas";
const lastName = process.env.SEED_OWNER_LAST_NAME ?? "Īpašnieks";
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
if (!existing.length) {
  await db.insert(users).values({
    firstName,
    lastName,
    displayName: `${firstName} ${lastName}`,
    company: process.env.SEED_OWNER_COMPANY ?? "Kopienas administrācija",
    phoneEncrypted: encryptPhone(phone),
    phoneLookup: lookup,
    phoneLast4: phone.slice(-4),
    role: "owner",
    status: "active",
  });
  console.log(`Owner izveidots: ${firstName} ${lastName}, •••• ${phone.slice(-4)}`);
} else {
  console.log("Owner ar šo tālruņa numuru jau eksistē.");
}

process.exit(0);
