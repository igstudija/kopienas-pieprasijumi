import { NextRequest, NextResponse } from "next/server";
import { and, desc, gt, isNull } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { federationInvites, peerInstances } from "@/lib/db/schema";
import { assertSameOrigin, jsonError, requestMeta } from "@/lib/http";
import { currentUserFromRequest } from "@/lib/services/auth";
import { connectToPeer, createFederationPeerDraft } from "@/lib/services/federation";

const createSchema = z.object({ name: z.string().trim().min(2).max(160) });
const connectSchema = z.object({ peerId: z.uuid(), pairingCode: z.string().min(20).max(4000) });

export async function GET(request: NextRequest) {
  try {
    const actor = await currentUserFromRequest(request);
    if (!actor || actor.role === "member") return NextResponse.json({ error: "Nepietiekamas tiesības." }, { status: 403 });
    const db = getDb();
    const [peers, activeInvites] = await Promise.all([
      db.select().from(peerInstances).orderBy(desc(peerInstances.createdAt)),
      db.select({ peerId: federationInvites.peerId }).from(federationInvites).where(and(gt(federationInvites.expiresAt, new Date()), isNull(federationInvites.usedAt))),
    ]);
    const invitePeerIds = new Set(activeInvites.map((invite) => invite.peerId).filter((peerId): peerId is string => Boolean(peerId)));
    return NextResponse.json({ peers: peers.map((peer) => ({
      ...peer,
      remoteCodeState: peer.allowIncoming ? "accepted" : "missing",
      localCodeState: peer.allowOutgoing ? "accepted" : invitePeerIds.has(peer.id) ? "created" : "missing",
    })) });
  } catch (error) {
    return jsonError(error, "Savienojumus neizdevās ielādēt.");
  }
}

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const actor = await currentUserFromRequest(request);
    if (!actor) return NextResponse.json({ error: "Nepieciešama autorizācija." }, { status: 401 });
    const body = await request.json();
    const createInput = createSchema.safeParse(body);
    if (createInput.success) {
      return NextResponse.json({ peer: await createFederationPeerDraft(actor, createInput.data.name, requestMeta(request)) }, { status: 201 });
    }
    const connectInput = connectSchema.parse(body);
    return NextResponse.json({ peer: await connectToPeer(actor, connectInput.pairingCode, connectInput.peerId) }, { status: 201 });
  } catch (error) {
    return jsonError(error, "Instanci neizdevās savienot.");
  }
}
