import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertSameOrigin, jsonError, requestMeta } from "@/lib/http";
import { currentUserFromRequest } from "@/lib/services/auth";
import { deleteUser, setUserStatus, updateUserPhone } from "@/lib/services/users";

const updateSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("update_phone"), phone: z.string().trim().min(6).max(30) }),
  z.object({ action: z.literal("set_status"), status: z.enum(["active", "suspended"]) }),
]);

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const actor = await currentUserFromRequest(request);
    if (!actor || actor.role === "member") {
      return NextResponse.json({ error: "Nepietiekamas tiesības." }, { status: 403 });
    }
    const { id } = await context.params;
    const userId = z.uuid().parse(id);
    const input = updateSchema.parse(await request.json());
    if (input.action === "update_phone") {
      await updateUserPhone(actor, userId, input.phone, requestMeta(request));
    } else {
      await setUserStatus(actor, userId, input.status, requestMeta(request));
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error, "Lietotāju neizdevās atjaunināt.");
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const actor = await currentUserFromRequest(request);
    if (!actor || actor.role === "member") {
      return NextResponse.json({ error: "Nepietiekamas tiesības." }, { status: 403 });
    }
    const { id } = await context.params;
    await deleteUser(actor, z.uuid().parse(id), requestMeta(request));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error, "Lietotāju neizdevās dzēst.");
  }
}
