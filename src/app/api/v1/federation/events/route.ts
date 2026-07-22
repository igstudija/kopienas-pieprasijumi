import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { HttpError, jsonError } from "@/lib/http";
import { processFederationEvent, verifyFederationRequest } from "@/lib/services/federation";

const eventSchema = z.object({
  eventId: z.uuid(),
  type: z.enum(["request.upserted", "request.deleted"]),
  originInstanceId: z.uuid(),
  request: z.object({
    id: z.uuid(),
    title: z.string().min(1).max(180),
    details: z.string().min(1).max(4000),
    target: z.string().max(240).optional().nullable(),
    industry: z.string().max(160).optional().nullable(),
    region: z.string().max(160).optional().nullable(),
    tags: z.array(z.string().max(50)).max(10),
    status: z.enum(["active", "fulfilled", "archived"]),
    revision: z.number().int().positive(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
    author: z.object({
      id: z.uuid().optional(),
      displayName: z.string().min(1).max(160),
      company: z.string().min(1).max(180),
      category: z.string().max(180).optional().nullable(),
    }),
  }),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const peer = await verifyFederationRequest({
      peerInstanceId: requiredHeader(request, "x-community-instance"),
      method: "POST",
      path: request.nextUrl.pathname,
      timestamp: requiredHeader(request, "x-community-timestamp"),
      nonce: requiredHeader(request, "x-community-nonce"),
      keyId: requiredHeader(request, "x-community-key-id"),
      signature: requiredHeader(request, "x-community-signature"),
      body,
    });
    const event = eventSchema.parse(JSON.parse(body));
    return NextResponse.json({ ok: true, ...(await processFederationEvent(peer, event)) });
  } catch (error) {
    return jsonError(error, "Federācijas notikumu neizdevās apstrādāt.");
  }
}

function requiredHeader(request: NextRequest, name: string) {
  const value = request.headers.get(name);
  if (!value) throw new HttpError(401, `Trūkst ${name} galvenes.`);
  return value;
}
