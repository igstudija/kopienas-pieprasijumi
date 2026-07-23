import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertSameOrigin, jsonError, requestMeta } from "@/lib/http";
import { currentUserFromRequest } from "@/lib/services/auth";
import {
  getEmailAdminSettings,
  sendEmailSettingsTest,
  updateEmailAdminSettings,
} from "@/lib/services/email-settings";
import { getInstanceLocale } from "@/lib/services/instance-settings";

const settingsSchema = z.object({
  provider: z.enum(["brevo", "mailjet", "custom"]),
  host: z.string().trim().max(255).optional().nullable(),
  port: z.number().int().min(1).max(65535).optional().nullable(),
  secure: z.boolean().optional().nullable(),
  username: z.string().trim().max(500).optional().nullable(),
  password: z.string().max(1000).optional().nullable(),
  fromAddress: z.email().max(320),
  fromName: z.string().trim().min(1).max(160),
});

const testSchema = z.object({
  to: z.email().max(320),
});

export async function GET(request: NextRequest) {
  try {
    const actor = await currentUserFromRequest(request);
    if (!actor || actor.role === "member") {
      return NextResponse.json({ error: "Insufficient permissions." }, { status: 403 });
    }
    return NextResponse.json({ settings: await getEmailAdminSettings() });
  } catch (error) {
    return jsonError(error, "Email settings could not be loaded.");
  }
}

export async function PATCH(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const actor = await currentUserFromRequest(request);
    if (!actor || actor.role === "member") {
      return NextResponse.json({ error: "Insufficient permissions." }, { status: 403 });
    }
    const settings = await updateEmailAdminSettings(
      actor,
      settingsSchema.parse(await request.json()),
      requestMeta(request),
    );
    return NextResponse.json({ settings });
  } catch (error) {
    return jsonError(error, "Email settings could not be saved.");
  }
}

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const actor = await currentUserFromRequest(request);
    if (!actor || actor.role === "member") {
      return NextResponse.json({ error: "Insufficient permissions." }, { status: 403 });
    }
    const input = testSchema.parse(await request.json());
    await sendEmailSettingsTest(actor, input.to, await getInstanceLocale(), requestMeta(request));
    return NextResponse.json({ sent: true });
  } catch (error) {
    return jsonError(error, "Test email could not be sent.");
  }
}
