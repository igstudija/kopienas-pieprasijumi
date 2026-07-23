import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertSameOrigin, jsonError, requestMeta } from "@/lib/http";
import { currentUserFromRequest } from "@/lib/services/auth";
import {
  getGeneralInstanceSettings,
  updateGeneralInstanceSettings,
} from "@/lib/services/instance-settings";

const schema = z.object({
  locale: z.enum(["lv", "en", "lt", "et"]),
});

export async function GET(request: NextRequest) {
  try {
    const actor = await currentUserFromRequest(request);
    if (!actor || actor.role === "member") {
      return NextResponse.json({ error: "Insufficient permissions." }, { status: 403 });
    }
    return NextResponse.json({ settings: await getGeneralInstanceSettings() });
  } catch (error) {
    return jsonError(error, "General settings could not be loaded.");
  }
}

export async function PATCH(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const actor = await currentUserFromRequest(request);
    if (!actor || actor.role === "member") {
      return NextResponse.json({ error: "Insufficient permissions." }, { status: 403 });
    }
    const settings = await updateGeneralInstanceSettings(
      actor,
      schema.parse(await request.json()),
      requestMeta(request),
    );
    return NextResponse.json({ settings });
  } catch (error) {
    return jsonError(error, "General settings could not be saved.");
  }
}
