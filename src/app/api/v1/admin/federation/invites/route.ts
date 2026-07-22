import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertSameOrigin, jsonError } from "@/lib/http";
import { currentUserFromRequest } from "@/lib/services/auth";
import { createFederationInvite } from "@/lib/services/federation";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const actor = await currentUserFromRequest(request);
    if (!actor) return NextResponse.json({ error: "Nepieciešama autorizācija." }, { status: 401 });
    const { label } = z.object({ label: z.string().trim().min(2).max(160) }).parse(await request.json());
    return NextResponse.json(await createFederationInvite(actor, label), { status: 201 });
  } catch (error) {
    return jsonError(error, "Uzaicinājumu neizdevās izveidot.");
  }
}
