import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertSameOrigin, jsonError, requestMeta } from "@/lib/http";
import { currentUserFromRequest } from "@/lib/services/auth";
import { getWhatsappAdminSettings, updateWhatsappAdminSettings } from "@/lib/services/whatsapp-admin";

const schema = z.object({
  businessNumber: z.string().trim().min(6).max(30),
  appSecret: z.string().trim().max(500).optional().nullable(),
  regenerateVerifyToken: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const actor = await currentUserFromRequest(request);
    if (!actor || actor.role === "member") return NextResponse.json({ error: "Insufficient permissions." }, { status: 403 });
    return NextResponse.json({ settings: await getWhatsappAdminSettings() });
  } catch (error) {
    return jsonError(error, "WhatsApp settings could not be loaded.");
  }
}

export async function PATCH(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const actor = await currentUserFromRequest(request);
    if (!actor || actor.role === "member") return NextResponse.json({ error: "Insufficient permissions." }, { status: 403 });
    const settings = await updateWhatsappAdminSettings(actor, schema.parse(await request.json()), requestMeta(request));
    return NextResponse.json({ settings });
  } catch (error) {
    return jsonError(error, "WhatsApp settings could not be saved.");
  }
}
