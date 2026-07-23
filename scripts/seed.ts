import { eq, sql } from "drizzle-orm";
import { getDb } from "../src/lib/db/client";
import { instanceSettings, users } from "../src/lib/db/schema";
import { appUrl, instanceId } from "../src/lib/env";
import { encryptPhone, normalizeEmail, normalizePhone, phoneLookup } from "../src/lib/security";

const phone = normalizePhone(process.env.SEED_OWNER_PHONE ?? "+37120000000");
const email = normalizeEmail(process.env.SEED_OWNER_EMAIL ?? "owner@example.com");
const firstName = process.env.SEED_OWNER_FIRST_NAME ?? "System";
const lastName = process.env.SEED_OWNER_LAST_NAME ?? "Owner";
const company = process.env.SEED_OWNER_COMPANY ?? "Community administration";
const db = getDb();

await db.insert(instanceSettings).values({
  id: instanceId(),
  name: process.env.INSTANCE_NAME ?? "Business community",
  baseUrl: appUrl(),
  federationPublicKey: process.env.FEDERATION_PUBLIC_KEY || null,
  federationKeyId: process.env.FEDERATION_KEY_ID || null,
}).onConflictDoNothing();

const [existing] = await db
  .select({ id: users.id })
  .from(users)
  .where(sql`lower(${users.email}) = ${email}`)
  .limit(1);
const values = {
  firstName,
  lastName,
  displayName: `${firstName} ${lastName}`,
  company,
  email,
  phoneEncrypted: encryptPhone(phone),
  phoneLookup: phoneLookup(phone),
  phoneLast4: phone.slice(-4),
  role: "owner" as const,
  status: "active" as const,
  updatedAt: new Date(),
};

if (existing) {
  await db.update(users).set(values).where(eq(users.id, existing.id));
  console.log(`Existing owner updated: ${email}`);
} else {
  const owners = await db.select({ id: users.id }).from(users).where(eq(users.role, "owner")).limit(2);
  if (owners.length === 1) {
    await db.update(users).set(values).where(eq(users.id, owners[0]!.id));
    console.log(`Existing owner contact details updated: ${email}`);
  } else if (owners.length > 1) {
    throw new Error("Multiple owners exist. Set SEED_OWNER_EMAIL to one existing owner before running the seed.");
  } else {
    await db.insert(users).values(values);
    console.log(`Owner created: ${email}`);
  }
}

process.exit(0);
