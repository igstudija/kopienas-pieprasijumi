import "server-only";

import { and, eq, inArray, lte } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { federationOutbox, peerInstances, specificRequests, users } from "@/lib/db/schema";
import { generateToken } from "@/lib/security";
import { federationIdentity, signFederationRequest, type FederationEvent } from "./federation";

const MAX_ATTEMPTS = 8;
const EVENT_PATH = "/api/v1/federation/events";

export async function dispatchFederationOutbox(limit = 10) {
  let delivered = 0;
  for (let index = 0; index < limit; index += 1) {
    const job = await claimNextJob();
    if (!job) break;
    try {
      await deliver(job);
      await getDb().update(federationOutbox).set({ status: "delivered", deliveredAt: new Date(), lastError: null }).where(eq(federationOutbox.id, job.id));
      delivered += 1;
    } catch (error) {
      const attempts = job.attempts + 1;
      const dead = attempts >= MAX_ATTEMPTS;
      const backoffMs = Math.min(60 * 60 * 1000, 5_000 * 2 ** Math.min(attempts, 8)) + Math.floor(Math.random() * 2_000);
      await getDb().update(federationOutbox).set({
        status: dead ? "dead" : "failed",
        attempts,
        nextAttemptAt: new Date(Date.now() + backoffMs),
        lastError: error instanceof Error ? error.message.slice(0, 1000) : "Nezināma piegādes kļūda",
      }).where(eq(federationOutbox.id, job.id));
    }
  }
  return delivered;
}

async function claimNextJob() {
  const db = getDb();
  const [candidate] = await db
    .select()
    .from(federationOutbox)
    .where(and(inArray(federationOutbox.status, ["pending", "failed"]), lte(federationOutbox.nextAttemptAt, new Date())))
    .limit(1);
  if (!candidate) return null;
  const [claimed] = await db
    .update(federationOutbox)
    .set({ status: "processing" })
    .where(and(eq(federationOutbox.id, candidate.id), inArray(federationOutbox.status, ["pending", "failed"])))
    .returning();
  return claimed ?? null;
}

async function deliver(job: typeof federationOutbox.$inferSelect) {
  const db = getDb();
  const [record] = await db
    .select({ request: specificRequests, author: users, peer: peerInstances })
    .from(federationOutbox)
    .innerJoin(peerInstances, eq(federationOutbox.peerId, peerInstances.id))
    .innerJoin(specificRequests, eq(federationOutbox.aggregateId, specificRequests.id))
    .innerJoin(users, eq(specificRequests.authorId, users.id))
    .where(and(eq(federationOutbox.id, job.id), eq(peerInstances.status, "active"), eq(peerInstances.allowOutgoing, true)))
    .limit(1);
  if (!record) throw new Error("Outbox ierakstam nav aktīva peer vai pieprasījuma.");
  if (!record.peer.baseUrl) throw new Error("Peer nav konfigurēts federācijas domēns.");

  const event: FederationEvent = {
    eventId: job.eventId,
    type: job.eventType as FederationEvent["type"],
    originInstanceId: (await federationIdentity()).instanceId,
    request: {
      id: record.request.id,
      title: record.request.title,
      details: job.eventType === "request.deleted" ? "Pieprasījums vairs netiek koplietots." : record.request.details,
      target: job.eventType === "request.deleted" ? null : record.request.target,
      industry: job.eventType === "request.deleted" ? null : record.request.industry,
      region: job.eventType === "request.deleted" ? null : record.request.region,
      tags: job.eventType === "request.deleted" ? [] : record.request.tags,
      status: job.eventType === "request.deleted" ? "archived" : record.request.status,
      revision: job.revision,
      createdAt: record.request.createdAt.toISOString(),
      updatedAt: record.request.updatedAt.toISOString(),
      author: {
        displayName: record.author.displayName,
        company: record.author.company,
        category: record.author.category,
      },
    },
  };
  const body = JSON.stringify(event);
  const timestamp = new Date().toISOString();
  const nonce = generateToken(18);
  const identity = await federationIdentity();
  const response = await fetch(`${record.peer.baseUrl.replace(/\/$/, "")}${EVENT_PATH}`, {
    method: "POST",
    redirect: "error",
    headers: {
      "content-type": "application/json",
      "x-community-instance": identity.instanceId,
      "x-community-timestamp": timestamp,
      "x-community-nonce": nonce,
      "x-community-key-id": identity.keyId,
      "x-community-signature": await signFederationRequest("POST", EVENT_PATH, timestamp, nonce, body),
    },
    body,
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`Peer atbildēja ar HTTP ${response.status}.`);
}
