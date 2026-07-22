import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertSameOrigin, jsonError, requestMeta } from "@/lib/http";
import { currentUserFromRequest } from "@/lib/services/auth";
import { deleteFederationPeer, updateFederationPeer } from "@/lib/services/federation";

const updateSchema = z.object({
  name: z.string().trim().min(2).max(160).optional(),
  status: z.enum(["pending", "active", "paused"]).optional(),
}).refine((input) => input.name !== undefined || input.status !== undefined, "Nav norādītas izmaiņas.");

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const actor = await currentUserFromRequest(request);
    if (!actor || actor.role === "member") return NextResponse.json({ error: "Nepietiekamas tiesības." }, { status: 403 });
    const { id } = await context.params;
    await updateFederationPeer(actor, z.uuid().parse(id), updateSchema.parse(await request.json()), requestMeta(request));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error, "Savienoto portālu neizdevās atjaunināt.");
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const actor = await currentUserFromRequest(request);
    if (!actor || actor.role === "member") return NextResponse.json({ error: "Nepietiekamas tiesības." }, { status: 403 });
    const { id } = await context.params;
    await deleteFederationPeer(actor, z.uuid().parse(id), requestMeta(request));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error, "Savienoto portālu neizdevās dzēst.");
  }
}
