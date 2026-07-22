import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertSameOrigin, jsonError, requestMeta } from "@/lib/http";
import { currentUserFromRequest } from "@/lib/services/auth";
import { getOwnProfile, updateUserProfile } from "@/lib/services/users";

const schema = z.object({
  firstName: z.string().trim().min(2).max(100),
  lastName: z.string().trim().min(2).max(100),
  company: z.string().trim().min(2).max(180),
  category: z.string().trim().max(180).optional().nullable(),
  email: z.union([z.literal(""), z.email().max(320)]).optional().nullable(),
  phone: z.string().trim().min(6).max(30),
});

export async function GET(request: NextRequest) {
  try {
    const user = await currentUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Nepieciešama autorizācija." }, { status: 401 });
    return NextResponse.json({ profile: await getOwnProfile(user.id) });
  } catch (error) {
    return jsonError(error, "Profilu neizdevās ielādēt.");
  }
}

export async function PATCH(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await currentUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Nepieciešama autorizācija." }, { status: 401 });
    await updateUserProfile(user, user.id, schema.parse(await request.json()), requestMeta(request));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error, "Profilu neizdevās saglabāt.");
  }
}
