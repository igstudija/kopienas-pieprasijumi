import { after, NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertSameOrigin, jsonError, requestMeta } from "@/lib/http";
import { currentUserFromRequest } from "@/lib/services/auth";
import { deleteOwnRequest, updateRequest } from "@/lib/services/requests";
import { dispatchFederationOutbox } from "@/lib/services/federation-dispatch";

const updateSchema = z.object({
  title: z.string().trim().min(4).max(180).optional(),
  details: z.string().trim().min(10).max(4000).optional(),
  target: z.string().trim().max(240).nullable().optional(),
  industry: z.string().trim().max(160).nullable().optional(),
  region: z.string().trim().max(160).nullable().optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  visibility: z.enum(["local", "selected_peers", "all_peers"]).optional(),
  peerIds: z.array(z.uuid()).max(20).optional(),
  status: z.enum(["active", "fulfilled", "archived"]).optional(),
});

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const user = await currentUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Nepieciešama autorizācija." }, { status: 401 });
    const { id } = await context.params;
    const input = updateSchema.parse(await request.json());
    await updateRequest(user, z.uuid().parse(id), input, requestMeta(request));
    after(() => dispatchFederationOutbox().catch((error) => console.error("Federācijas piegāde neizdevās", error)));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error, "Pieprasījumu neizdevās atjaunot.");
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const user = await currentUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Nepieciešama autorizācija." }, { status: 401 });
    const { id } = await context.params;
    await deleteOwnRequest(user, z.uuid().parse(id), requestMeta(request));
    after(() => dispatchFederationOutbox().catch((error) => console.error("Federācijas piegāde neizdevās", error)));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error, "Pieprasījumu neizdevās dzēst.");
  }
}
