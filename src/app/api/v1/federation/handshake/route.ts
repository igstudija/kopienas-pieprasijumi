import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { jsonError } from "@/lib/http";
import { acceptHandshake } from "@/lib/services/federation";

const schema = z.object({
  inviteId: z.uuid(),
  secret: z.string().min(32).max(200),
  peer: z.object({
    instanceId: z.uuid(),
    name: z.string().min(2).max(160),
    baseUrl: z.url(),
    protocolVersion: z.number().int(),
    keyId: z.string().min(1).max(100),
    publicKey: z.string().min(40).max(1000),
  }),
});

export async function POST(request: NextRequest) {
  try {
    const input = schema.parse(await request.json());
    return NextResponse.json({ peer: await acceptHandshake(input) });
  } catch (error) {
    return jsonError(error, "Federācijas handshake neizdevās.");
  }
}
