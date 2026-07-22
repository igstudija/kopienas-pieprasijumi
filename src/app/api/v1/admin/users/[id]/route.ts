import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertSameOrigin, jsonError, requestMeta } from "@/lib/http";
import { currentUserFromRequest } from "@/lib/services/auth";
import { deleteUser, setUserStatus, updateUserPhone, updateUserProfile } from "@/lib/services/users";

const updateSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("update_phone"), phone: z.string().trim().min(6).max(30) }),
  z.object({ action: z.literal("set_status"), status: z.enum(["active", "suspended"]) }),
  z.object({
    action: z.literal("update_profile"),
    firstName: z.string().trim().min(2).max(100),
    lastName: z.string().trim().min(2).max(100),
    company: z.string().trim().min(2).max(180),
    category: z.string().trim().max(180).optional().nullable(),
    email: z.union([z.literal(""), z.email().max(320)]).optional().nullable(),
    phone: z.string().trim().max(30).optional().nullable(),
    role: z.enum(["admin", "member"]).optional(),
    password: z.string().max(200).optional().nullable(),
  }),
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
    } else if (input.action === "set_status") {
      await setUserStatus(actor, userId, input.status, requestMeta(request));
    } else {
      await updateUserProfile(actor, userId, input, requestMeta(request));
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
