import { NextRequest, NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { peerInstances } from "@/lib/db/schema";
import { assertSameOrigin, jsonError } from "@/lib/http";
import { currentUserFromRequest } from "@/lib/services/auth";
import { connectToPeer } from "@/lib/services/federation";

export async function GET(request: NextRequest) {
  try {
    const actor = await currentUserFromRequest(request);
    if (!actor || actor.role === "member") return NextResponse.json({ error: "Nepietiekamas tiesības." }, { status: 403 });
    const peers = await getDb().select().from(peerInstances).orderBy(desc(peerInstances.createdAt));
    return NextResponse.json({ peers });
  } catch (error) {
    return jsonError(error, "Savienojumus neizdevās ielādēt.");
  }
}

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const actor = await currentUserFromRequest(request);
    if (!actor) return NextResponse.json({ error: "Nepieciešama autorizācija." }, { status: 401 });
    const { pairingCode } = z.object({ pairingCode: z.string().min(20).max(4000) }).parse(await request.json());
    return NextResponse.json({ peer: await connectToPeer(actor, pairingCode) }, { status: 201 });
  } catch (error) {
    return jsonError(error, "Instanci neizdevās savienot.");
  }
}
