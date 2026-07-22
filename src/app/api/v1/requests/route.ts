import { after, NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertSameOrigin, jsonError, requestMeta } from "@/lib/http";
import { currentUserFromRequest } from "@/lib/services/auth";
import { createRequest, listGroupedRequests } from "@/lib/services/requests";
import { dispatchFederationOutbox } from "@/lib/services/federation-dispatch";

const requestSchema = z.object({
  title: z.string().trim().min(4, "Virsrakstam jābūt vismaz 4 rakstzīmēm.").max(180),
  details: z.string().trim().min(10, "Aprakstam jābūt vismaz 10 rakstzīmēm.").max(4000),
  target: z.string().trim().max(240).optional().nullable(),
  industry: z.string().trim().max(160).optional().nullable(),
  region: z.string().trim().max(160).optional().nullable(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  visibility: z.enum(["local", "selected_peers", "all_peers"]).default("local"),
  peerIds: z.array(z.uuid()).max(20).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await currentUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Nepieciešama autorizācija." }, { status: 401 });
    return NextResponse.json({ groups: await listGroupedRequests(), currentUserId: user.id });
  } catch (error) {
    return jsonError(error, "Pieprasījumus neizdevās ielādēt.");
  }
}

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await currentUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Nepieciešama autorizācija." }, { status: 401 });
    const input = requestSchema.parse(await request.json());
    const id = await createRequest(user, input, requestMeta(request));
    after(() => dispatchFederationOutbox().catch((error) => console.error("Federācijas piegāde neizdevās", error)));
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    return jsonError(error, "Pieprasījumu neizdevās izveidot.");
  }
}
