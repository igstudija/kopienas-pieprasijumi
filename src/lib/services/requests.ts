import "server-only";

import { and, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  federationOutbox,
  peerInstances,
  remoteRequests,
  requestPeerVisibility,
  specificRequests,
  type User,
  users,
} from "@/lib/db/schema";
import { groupRequests } from "@/lib/request-grouping";
import { HttpError } from "@/lib/http";
import { writeAudit } from "./audit";
import { getInstanceRuntime } from "./installation";

export type RequestInput = {
  title: string;
  details: string;
  target?: string | null;
  industry?: string | null;
  region?: string | null;
  tags?: string[];
  visibility?: "local" | "selected_peers" | "all_peers";
  peerIds?: string[];
};

export async function listGroupedRequests() {
  const db = getDb();
  const localRows = await db
    .select({ request: specificRequests, author: users })
    .from(specificRequests)
    .innerJoin(users, eq(specificRequests.authorId, users.id))
    .where(eq(specificRequests.status, "active"))
    .orderBy(desc(specificRequests.updatedAt));

  const remoteRows = await db
    .select({ request: remoteRequests, peer: peerInstances })
    .from(remoteRequests)
    .innerJoin(peerInstances, eq(remoteRequests.peerId, peerInstances.id))
    .where(and(eq(remoteRequests.status, "active"), eq(peerInstances.status, "active")))
    .orderBy(desc(remoteRequests.originUpdatedAt));

  return groupRequests([
    ...localRows.map(({ request, author }) => ({
      id: request.id,
      authorId: author.id,
      authorName: author.displayName,
      authorCompany: author.company,
      authorCategory: author.category,
      title: request.title,
      details: request.details,
      target: request.target,
      industry: request.industry,
      region: request.region,
      tags: request.tags,
      updatedAt: request.updatedAt,
      createdAt: request.createdAt,
      origin: "local" as const,
      peerName: null,
    })),
    ...remoteRows.map(({ request, peer }) => ({
      id: request.id,
      authorId: `${request.originInstanceId}:${request.authorDisplayName}`,
      authorName: request.authorDisplayName,
      authorCompany: request.authorCompany,
      authorCategory: request.authorCategory,
      title: request.title,
      details: request.details,
      target: request.target,
      industry: request.industry,
      region: request.region,
      tags: request.tags,
      updatedAt: request.originUpdatedAt,
      createdAt: request.originCreatedAt,
      origin: "remote" as const,
      peerName: peer.name,
    })),
  ]);
}

export async function createRequest(actor: User, input: RequestInput, audit: { ipAddress?: string | null; requestId?: string | null }) {
  const db = getDb();
  const runtime = await getInstanceRuntime();
  const requestId = crypto.randomUUID();
  await db.transaction(async (tx) => {
    await tx.insert(specificRequests).values({
      id: requestId,
      homeInstanceId: runtime.instanceId,
      authorId: actor.id,
      title: input.title,
      details: input.details,
      target: input.target ?? null,
      industry: input.industry ?? null,
      region: input.region ?? null,
      tags: cleanTags(input.tags),
      visibility: input.visibility ?? "local",
    });
    if (input.visibility === "selected_peers" && input.peerIds?.length) {
      await tx.insert(requestPeerVisibility).values(input.peerIds.map((peerId) => ({ requestId, peerId })));
    }
    const targetPeerIds = await resolveTargetPeerIds(tx, input.visibility ?? "local", input.peerIds ?? []);
    await queueRequestEvents(tx, requestId, targetPeerIds, "request.upserted", 1);
    await writeAudit(tx, {
      actorUserId: actor.id,
      action: "request.created",
      objectType: "specific_request",
      objectId: requestId,
      ipAddress: audit.ipAddress,
      requestId: audit.requestId,
    });
  });
  return requestId;
}

export async function updateRequest(
  actor: User,
  requestId: string,
  input: Partial<RequestInput> & { status?: "active" | "fulfilled" | "archived" },
  audit: { ipAddress?: string | null; requestId?: string | null },
) {
  const db = getDb();
  const [existing] = await db.select().from(specificRequests).where(eq(specificRequests.id, requestId)).limit(1);
  if (!existing) throw new HttpError(404, "Pieprasījums nav atrasts.");
  if (existing.authorId !== actor.id && actor.role === "member") throw new HttpError(403, "Nav tiesību labot šo pieprasījumu.");

  const revision = existing.revision + 1;
  const visibility = input.visibility ?? existing.visibility;
  const status = input.status ?? existing.status;
  const values = {
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.details !== undefined ? { details: input.details } : {}),
    ...(input.target !== undefined ? { target: input.target } : {}),
    ...(input.industry !== undefined ? { industry: input.industry } : {}),
    ...(input.region !== undefined ? { region: input.region } : {}),
    ...(input.tags !== undefined ? { tags: cleanTags(input.tags) } : {}),
    visibility,
    status,
    revision,
    updatedAt: new Date(),
    archivedAt: status === "archived" ? new Date() : null,
  };

  await db.transaction(async (tx) => {
    const oldSelectedRows = await tx
      .select({ peerId: requestPeerVisibility.peerId })
      .from(requestPeerVisibility)
      .where(eq(requestPeerVisibility.requestId, requestId));
    const oldTargets = await resolveTargetPeerIds(tx, existing.visibility, oldSelectedRows.map((row) => row.peerId));
    const newTargets = await resolveTargetPeerIds(tx, visibility, input.peerIds ?? oldSelectedRows.map((row) => row.peerId));
    await tx.update(specificRequests).set(values).where(eq(specificRequests.id, requestId));
    if (input.visibility !== undefined || input.peerIds !== undefined) {
      await tx.delete(requestPeerVisibility).where(eq(requestPeerVisibility.requestId, requestId));
      if (visibility === "selected_peers" && input.peerIds?.length) {
        await tx.insert(requestPeerVisibility).values(input.peerIds.map((peerId) => ({ requestId, peerId })));
      }
    }
    const removedTargets = status === "archived"
      ? [...new Set([...oldTargets, ...newTargets])]
      : oldTargets.filter((peerId) => !newTargets.includes(peerId));
    if (removedTargets.length) await queueRequestEvents(tx, requestId, removedTargets, "request.deleted", revision);
    if (status !== "archived" && newTargets.length) await queueRequestEvents(tx, requestId, newTargets, "request.upserted", revision);
    await writeAudit(tx, {
      actorUserId: actor.id,
      action: "request.updated",
      objectType: "specific_request",
      objectId: requestId,
      details: { revision, status, visibility },
      ipAddress: audit.ipAddress,
      requestId: audit.requestId,
    });
  });
}

function cleanTags(tags?: string[]) {
  return [...new Set((tags ?? []).map((tag) => tag.trim().toLocaleLowerCase("lv")).filter(Boolean))].slice(0, 10);
}

type Transaction = Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];

async function resolveTargetPeerIds(
  tx: Transaction,
  visibility: "local" | "selected_peers" | "all_peers",
  selectedPeerIds: string[],
) {
  if (visibility === "local" || (visibility === "selected_peers" && !selectedPeerIds.length)) return [];
  const peers = await tx
    .select({ id: peerInstances.id })
    .from(peerInstances)
    .where(
      and(
        eq(peerInstances.status, "active"),
        eq(peerInstances.allowOutgoing, true),
        visibility === "selected_peers" ? inArray(peerInstances.id, selectedPeerIds) : undefined,
      ),
    );
  return peers.map((peer) => peer.id);
}

async function queueRequestEvents(
  tx: Transaction,
  requestId: string,
  peerIds: string[],
  eventType: string,
  revision: number,
) {
  if (!peerIds.length) return;
  const eventId = crypto.randomUUID();
  await tx.insert(federationOutbox).values(
    peerIds.map((peerId) => ({
      eventId,
      peerId,
      eventType,
      aggregateId: requestId,
      revision,
      payload: { requestId },
    })),
  );
}
