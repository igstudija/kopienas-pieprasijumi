import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertSameOrigin, jsonError, requestMeta } from "@/lib/http";
import { currentUserFromRequest } from "@/lib/services/auth";
import { getLegalSettings, updateLegalSettings } from "@/lib/services/legal-settings";

const schema = z.object({
  legalEntityName: z.string().trim().max(200),
  legalRegistrationNumber: z.string().trim().max(100),
  legalAddress: z.string().trim().max(500),
  legalCountry: z.string().trim().max(100),
  legalEmail: z.union([z.literal(""), z.email().max(320)]),
  legalPhone: z.string().trim().max(50),
  privacyContactEmail: z.union([z.literal(""), z.email().max(320)]),
  dataRetentionMonths: z.coerce.number().int().min(1).max(120),
});

export async function GET(request: NextRequest) {
  try {
    const actor = await currentUserFromRequest(request);
    if (!actor || actor.role === "member") return NextResponse.json({ error: "Nepietiekamas tiesības." }, { status: 403 });
    return NextResponse.json({ settings: await getLegalSettings() });
  } catch (error) {
    return jsonError(error, "Juridiskos iestatījumus neizdevās ielādēt.");
  }
}

export async function PATCH(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const actor = await currentUserFromRequest(request);
    if (!actor || actor.role === "member") return NextResponse.json({ error: "Nepietiekamas tiesības." }, { status: 403 });
    const input = schema.parse(await request.json());
    await updateLegalSettings(actor, input, requestMeta(request));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error, "Juridiskos iestatījumus neizdevās saglabāt.");
  }
}
