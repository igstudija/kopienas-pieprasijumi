import "server-only";

import { createPrivateKey, createPublicKey, generateKeyPairSync, sign, verify } from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  federationInbox,
  federationInvites,
  federationNonces,
  federationOutbox,
  peerInstances,
  remoteRequests,
  specificRequests,
  type User,
} from "@/lib/db/schema";
import { HttpError } from "@/lib/http";
import { decodePairingCode, type PairingPayload } from "@/lib/federation-code";
import { generateToken, inviteDigest, safeEqualHex, sha256 } from "@/lib/security";
import { writeAudit } from "./audit";
import { getInstanceRuntime } from "./installation";

const PROTOCOL_VERSION = 1;
const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;

type PeerMetadata = {
  instanceId: string;
  name: string;
  baseUrl: string;
  protocolVersion: number;
  keyId: string;
  publicKey: string;
};

let developmentKeyPair: ReturnType<typeof generateKeyPairSync> | undefined;

export async function federationIdentity(): Promise<PeerMetadata & { privateKey: string }> {
  const runtime = await getInstanceRuntime();
  if (runtime.privateKey && runtime.publicKey) {
    return {
      instanceId: runtime.instanceId,
      name: runtime.name,
      baseUrl: runtime.baseUrl,
      protocolVersion: PROTOCOL_VERSION,
      keyId: runtime.keyId,
      publicKey: runtime.publicKey,
      privateKey: runtime.privateKey,
    };
  }
  if (process.env.NODE_ENV === "production") throw new Error("Federācijas atslēgas nav konfigurētas.");
  developmentKeyPair ??= generateKeyPairSync("ed25519");
  return {
    instanceId: runtime.instanceId,
    name: runtime.name || "Lokālā testa kopiena",
    baseUrl: runtime.baseUrl,
    protocolVersion: PROTOCOL_VERSION,
    keyId: "ephemeral-development-key",
    publicKey: developmentKeyPair.publicKey.export({ type: "spki", format: "der" }).toString("base64"),
    privateKey: developmentKeyPair.privateKey.export({ type: "pkcs8", format: "der" }).toString("base64"),
  };
}

export async function createFederationPeerDraft(
  actor: User,
  nameInput: string,
  audit: { ipAddress?: string | null; requestId?: string | null },
) {
  if (actor.role !== "owner" && actor.role !== "admin") throw new HttpError(403, "Nepietiekamas tiesības.");
  const name = nameInput.trim();
  if (name.length < 2 || name.length > 160) throw new HttpError(400, "Portāla nosaukumam jābūt 2–160 rakstzīmes garam.");
  const db = getDb();
  return db.transaction(async (tx) => {
    const [peer] = await tx.insert(peerInstances).values({
      name,
      status: "pending",
      allowIncoming: false,
      allowOutgoing: false,
    }).returning();
    await writeAudit(tx, {
      actorUserId: actor.id,
      action: "federation.peer_draft_created",
      objectType: "peer_instance",
      objectId: peer.id,
      details: { name },
      ipAddress: audit.ipAddress,
      requestId: audit.requestId,
    });
    return peer;
  });
}

export async function createFederationInvite(actor: User, label: string | undefined, peerId?: string) {
  if (actor.role !== "owner" && actor.role !== "admin") throw new HttpError(403, "Nepietiekamas tiesības.");
  const db = getDb();
  if (peerId) {
    const [peer] = await db.select({ id: peerInstances.id }).from(peerInstances).where(eq(peerInstances.id, peerId)).limit(1);
    if (!peer) throw new HttpError(404, "Savienotais portāls nav atrasts.");
  }
  const id = crypto.randomUUID();
  const secret = generateToken(32);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await db.transaction(async (tx) => {
    await tx.insert(federationInvites).values({ id, secretDigest: inviteDigest(secret), label, peerId, createdBy: actor.id, expiresAt });
    await writeAudit(tx, {
      actorUserId: actor.id,
      action: "federation.invite_created",
      objectType: "federation_invite",
      objectId: id,
      details: { label, peerId, expiresAt: expiresAt.toISOString() },
    });
  });

  const identity = await federationIdentity();
  const payload: PairingPayload = {
    endpoint: `${identity.baseUrl}/api/v1/federation/handshake`,
    inviteId: id,
    secret,
    expiresAt: expiresAt.toISOString(),
    issuerName: identity.name,
    issuerBaseUrl: identity.baseUrl,
  };
  return { pairingCode: Buffer.from(JSON.stringify(payload)).toString("base64url"), expiresAt };
}

export async function acceptHandshake(input: { inviteId: string; secret: string; peer: PeerMetadata }) {
  validatePeerMetadata(input.peer);
  const db = getDb();
  const [invite] = await db
    .select()
    .from(federationInvites)
    .where(and(eq(federationInvites.id, input.inviteId), gt(federationInvites.expiresAt, new Date()), isNull(federationInvites.usedAt)))
    .limit(1);
  if (!invite || !safeEqualHex(invite.secretDigest, inviteDigest(input.secret))) throw new HttpError(401, "Uzaicinājums nav derīgs vai tā termiņš ir beidzies.");
  const identity = await federationIdentity();
  if (input.peer.instanceId === identity.instanceId) throw new HttpError(400, "Instanci nevar savienot pašai ar sevi.");

  const permissions = await db.transaction(async (tx) => {
    const [existingPeer] = await tx
      .select()
      .from(peerInstances)
      .where(eq(peerInstances.remoteInstanceId, input.peer.instanceId))
      .limit(1);
    const [linkedPeer] = invite.peerId
      ? await tx.select().from(peerInstances).where(eq(peerInstances.id, invite.peerId)).limit(1)
      : [];
    let targetPeer = linkedPeer ?? existingPeer;
    if (linkedPeer && existingPeer && linkedPeer.id !== existingPeer.id) {
      await tx.update(federationInvites).set({ peerId: existingPeer.id }).where(eq(federationInvites.peerId, linkedPeer.id));
      await tx.delete(peerInstances).where(eq(peerInstances.id, linkedPeer.id));
      targetPeer = { ...existingPeer, name: linkedPeer.name };
    }
    const hadOutgoing = targetPeer?.allowOutgoing ?? false;
    const values = {
      remoteInstanceId: input.peer.instanceId,
      name: targetPeer?.name ?? input.peer.name,
      baseUrl: input.peer.baseUrl,
      publicKey: input.peer.publicKey,
      keyId: input.peer.keyId,
      protocolVersion: input.peer.protocolVersion,
      status: "active" as const,
      allowOutgoing: true,
      updatedAt: new Date(),
    };
    const [storedPeer] = targetPeer
      ? await tx.update(peerInstances).set(values).where(eq(peerInstances.id, targetPeer.id)).returning()
      : await tx.insert(peerInstances).values({ ...values, allowIncoming: false }).returning();
    await tx.update(federationInvites).set({ usedAt: new Date() }).where(eq(federationInvites.id, invite.id));
    await writeAudit(tx, {
      actorUserId: invite.createdBy,
      action: "federation.outgoing_enabled",
      objectType: "peer_instance",
      objectId: input.peer.instanceId,
      details: { name: input.peer.name, baseUrl: input.peer.baseUrl, remoteCanReadLocal: true },
    });
    if (!hadOutgoing) await queueShareableRequestBackfill(tx, storedPeer.id);
    return {
      localCanReadRemote: storedPeer?.allowIncoming ?? false,
      remoteCanReadLocal: storedPeer?.allowOutgoing ?? true,
    };
  });
  const { privateKey: _, ...publicIdentity } = identity;
  void _;
  return { peer: publicIdentity, permissions };
}

export async function connectToPeer(actor: User, pairingCode: string, peerId?: string) {
  if (actor.role !== "owner" && actor.role !== "admin") throw new HttpError(403, "Nepietiekamas tiesības.");
  const db = getDb();
  const [selectedPeer] = peerId
    ? await db.select().from(peerInstances).where(eq(peerInstances.id, peerId)).limit(1)
    : [];
  if (peerId && !selectedPeer) throw new HttpError(404, "Savienotais portāls nav atrasts.");
  const pairing = parsePairingCode(pairingCode);
  validateEndpoint(pairing.endpoint);
  if (new Date(pairing.expiresAt) <= new Date()) throw new HttpError(400, "Uzaicinājuma termiņš ir beidzies.");
  const { privateKey: _, ...identity } = await federationIdentity();
  void _;
  const response = await fetch(pairing.endpoint, {
    method: "POST",
    redirect: "error",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ inviteId: pairing.inviteId, secret: pairing.secret, peer: identity }),
    signal: AbortSignal.timeout(10_000),
  });
  const data = (await response.json().catch(() => null)) as {
    peer?: PeerMetadata;
    error?: string;
  } | null;
  if (!response.ok || !data?.peer) throw new HttpError(400, data?.error ?? "Savienojumu neizdevās izveidot.");
  validatePeerMetadata(data.peer);
  const permissions = await db.transaction(async (tx) => {
    const [existingPeer] = await tx.select().from(peerInstances).where(eq(peerInstances.remoteInstanceId, data.peer!.instanceId)).limit(1);
    const [draftPeer] = peerId ? await tx.select().from(peerInstances).where(eq(peerInstances.id, peerId)).limit(1) : [];
    let targetPeer = draftPeer ?? existingPeer;
    if (draftPeer && existingPeer && draftPeer.id !== existingPeer.id) {
      await tx.update(federationInvites).set({ peerId: existingPeer.id }).where(eq(federationInvites.peerId, draftPeer.id));
      await tx.delete(peerInstances).where(eq(peerInstances.id, draftPeer.id));
      targetPeer = { ...existingPeer, name: draftPeer.name };
    }
    const values = {
      remoteInstanceId: data.peer!.instanceId,
      name: targetPeer?.name ?? data.peer!.name,
      baseUrl: data.peer!.baseUrl,
      publicKey: data.peer!.publicKey,
      keyId: data.peer!.keyId,
      protocolVersion: data.peer!.protocolVersion,
      status: "active" as const,
      allowIncoming: true,
      updatedAt: new Date(),
    };
    const [storedPeer] = targetPeer
      ? await tx.update(peerInstances).set(values).where(eq(peerInstances.id, targetPeer.id)).returning()
      : await tx.insert(peerInstances).values({ ...values, allowOutgoing: false }).returning();
    await writeAudit(tx, {
      actorUserId: actor.id,
      action: "federation.incoming_enabled",
      objectType: "peer_instance",
      objectId: data.peer!.instanceId,
      details: { name: data.peer!.name, baseUrl: data.peer!.baseUrl, localCanReadRemote: true },
    });
    return {
      localCanReadRemote: storedPeer?.allowIncoming ?? true,
      remoteCanReadLocal: storedPeer?.allowOutgoing ?? false,
    };
  });
  return { ...data.peer, status: "active" as const, ...permissions };
}

export async function updateFederationPeer(
  actor: User,
  peerId: string,
  input: { name?: string; status?: "pending" | "active" | "paused" },
  audit: { ipAddress?: string | null; requestId?: string | null },
) {
  if (actor.role !== "owner" && actor.role !== "admin") throw new HttpError(403, "Nepietiekamas tiesības.");
  const db = getDb();
  const [peer] = await db.select().from(peerInstances).where(eq(peerInstances.id, peerId)).limit(1);
  if (!peer) throw new HttpError(404, "Savienotais portāls nav atrasts.");
  const name = input.name?.trim();
  if (name !== undefined && (name.length < 2 || name.length > 160)) throw new HttpError(400, "Portāla nosaukumam jābūt 2–160 rakstzīmes garam.");
  if (name === undefined && input.status === undefined) throw new HttpError(400, "Nav norādītas izmaiņas.");
  await db.transaction(async (tx) => {
    await tx.update(peerInstances).set({
      ...(name !== undefined ? { name } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      updatedAt: new Date(),
    }).where(eq(peerInstances.id, peerId));
    await writeAudit(tx, {
      actorUserId: actor.id,
      action: input.status === "paused" ? "federation.peer_paused" : input.status === "active" ? "federation.peer_activated" : "federation.peer_updated",
      objectType: "peer_instance",
      objectId: peer.remoteInstanceId,
      details: { name: name ?? peer.name, status: input.status ?? peer.status },
      ipAddress: audit.ipAddress,
      requestId: audit.requestId,
    });
  });
}

export async function deleteFederationPeer(
  actor: User,
  peerId: string,
  audit: { ipAddress?: string | null; requestId?: string | null },
) {
  if (actor.role !== "owner" && actor.role !== "admin") throw new HttpError(403, "Nepietiekamas tiesības.");
  const db = getDb();
  const [peer] = await db.select().from(peerInstances).where(eq(peerInstances.id, peerId)).limit(1);
  if (!peer) throw new HttpError(404, "Savienotais portāls nav atrasts.");
  await db.transaction(async (tx) => {
    await tx.delete(peerInstances).where(eq(peerInstances.id, peerId));
    await writeAudit(tx, {
      actorUserId: actor.id,
      action: "federation.peer_deleted",
      objectType: "peer_instance",
      objectId: peer.remoteInstanceId,
      details: { name: peer.name, baseUrl: peer.baseUrl },
      ipAddress: audit.ipAddress,
      requestId: audit.requestId,
    });
  });
}

type FederationTransaction = Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];

async function queueShareableRequestBackfill(tx: FederationTransaction, peerId: string) {
  const requests = await tx
    .select({ id: specificRequests.id, revision: specificRequests.revision })
    .from(specificRequests)
    .where(and(eq(specificRequests.status, "active"), eq(specificRequests.visibility, "all_peers")));
  if (!requests.length) return;
  await tx.insert(federationOutbox).values(requests.map((request) => ({
    eventId: crypto.randomUUID(),
    peerId,
    eventType: "request.upserted",
    aggregateId: request.id,
    revision: request.revision,
    payload: { requestId: request.id },
  })));
}

export async function signFederationRequest(method: string, path: string, timestamp: string, nonce: string, body: string) {
  const identity = await federationIdentity();
  const canonical = canonicalRequest(method, path, timestamp, nonce, body);
  const privateKey = createPrivateKey({ key: Buffer.from(identity.privateKey, "base64"), type: "pkcs8", format: "der" });
  return sign(null, Buffer.from(canonical), privateKey).toString("base64");
}

export async function verifyFederationRequest(input: {
  peerInstanceId: string;
  method: string;
  path: string;
  timestamp: string;
  nonce: string;
  body: string;
  signature: string;
  keyId: string;
}) {
  const parsedTime = Date.parse(input.timestamp);
  if (!Number.isFinite(parsedTime) || Math.abs(Date.now() - parsedTime) > MAX_CLOCK_SKEW_MS) throw new HttpError(401, "Federācijas pieprasījuma laiks nav derīgs.");
  const db = getDb();
  const [peer] = await db
    .select()
    .from(peerInstances)
    .where(and(eq(peerInstances.remoteInstanceId, input.peerInstanceId), eq(peerInstances.status, "active"), eq(peerInstances.allowIncoming, true)))
    .limit(1);
  if (!peer || !peer.publicKey || !peer.keyId || peer.keyId !== input.keyId) throw new HttpError(401, "Neuzticama instance vai atslēga.");

  const publicKey = createPublicKey({ key: Buffer.from(peer.publicKey, "base64"), type: "spki", format: "der" });
  const canonical = canonicalRequest(input.method, input.path, input.timestamp, input.nonce, input.body);
  if (!verify(null, Buffer.from(canonical), publicKey, Buffer.from(input.signature, "base64"))) throw new HttpError(401, "Federācijas paraksts nav derīgs.");
  try {
    await db.insert(federationNonces).values({ peerId: peer.id, nonce: input.nonce });
  } catch {
    throw new HttpError(409, "Federācijas pieprasījums jau ir apstrādāts.");
  }
  return peer;
}

export async function processFederationEvent(peerId: string, event: FederationEvent) {
  const db = getDb();
  const existing = await db.select({ id: federationInbox.id }).from(federationInbox).where(and(eq(federationInbox.eventId, event.eventId), eq(federationInbox.peerId, peerId))).limit(1);
  if (existing.length) return { duplicate: true };
  await db.transaction(async (tx) => {
    await tx.insert(federationInbox).values({ eventId: event.eventId, peerId, eventType: event.type, payload: event });
    const current = await tx
      .select()
      .from(remoteRequests)
      .where(and(eq(remoteRequests.originInstanceId, event.originInstanceId), eq(remoteRequests.originRequestId, event.request.id)))
      .limit(1);
    if (current[0] && current[0].revision >= event.request.revision) return;
    const values = {
      peerId,
      authorDisplayName: event.request.author.displayName,
      authorCompany: event.request.author.company,
      authorCategory: event.request.author.category ?? null,
      title: event.request.title,
      details: event.request.details,
      target: event.request.target ?? null,
      industry: event.request.industry ?? null,
      region: event.request.region ?? null,
      tags: event.request.tags,
      status: event.type === "request.deleted" ? ("archived" as const) : event.request.status,
      revision: event.request.revision,
      originCreatedAt: new Date(event.request.createdAt),
      originUpdatedAt: new Date(event.request.updatedAt),
      deletedAt: event.type === "request.deleted" ? new Date() : null,
      receivedAt: new Date(),
    };
    if (current[0]) {
      await tx.update(remoteRequests).set(values).where(eq(remoteRequests.id, current[0].id));
    } else {
      await tx.insert(remoteRequests).values({
        originInstanceId: event.originInstanceId,
        originRequestId: event.request.id,
        ...values,
      });
    }
  });
  return { duplicate: false };
}

function canonicalRequest(method: string, path: string, timestamp: string, nonce: string, body: string) {
  return [method.toUpperCase(), path, timestamp, nonce, sha256(body)].join("\n");
}

function parsePairingCode(code: string): PairingPayload {
  try {
    return decodePairingCode(code);
  } catch {
    throw new HttpError(400, "Savienošanas kods nav derīgs.");
  }
}

function validateEndpoint(value: string) {
  const url = new URL(value);
  const localDev = process.env.NODE_ENV !== "production" && ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  if (url.protocol !== "https:" && !(localDev && url.protocol === "http:")) throw new HttpError(400, "Federācijas endpoint jāizmanto HTTPS.");
  if (url.username || url.password) throw new HttpError(400, "Endpoint nedrīkst saturēt lietotājvārdu vai paroli.");
}

function validatePeerMetadata(peer: PeerMetadata) {
  if (peer.protocolVersion !== PROTOCOL_VERSION) throw new HttpError(400, "Federācijas protokola versija netiek atbalstīta.");
  validateEndpoint(`${peer.baseUrl.replace(/\/$/, "")}/api/v1/federation/events`);
  if (!peer.instanceId || !peer.name || !peer.publicKey || !peer.keyId) throw new HttpError(400, "Instances metadati nav pilnīgi.");
  try {
    createPublicKey({ key: Buffer.from(peer.publicKey, "base64"), type: "spki", format: "der" });
  } catch {
    throw new HttpError(400, "Federācijas publiskā atslēga nav derīga.");
  }
}

export type FederationEvent = {
  eventId: string;
  type: "request.upserted" | "request.deleted";
  originInstanceId: string;
  request: {
    id: string;
    title: string;
    details: string;
    target?: string | null;
    industry?: string | null;
    region?: string | null;
    tags: string[];
    status: "active" | "fulfilled" | "archived";
    revision: number;
    createdAt: string;
    updatedAt: string;
    author: { displayName: string; company: string; category?: string | null };
  };
};
