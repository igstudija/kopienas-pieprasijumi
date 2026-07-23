import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertSameOrigin, jsonError, requestMeta } from "@/lib/http";
import { completeInstallation } from "@/lib/services/installation";

const schema = z.object({
  setupPassword: z.string().min(12).max(200),
  instanceName: z.string().trim().min(2).max(160),
  timezone: z.string().trim().min(1).max(80).default("Europe/Riga"),
  locale: z.enum(["lv", "en", "lt", "et"]).default("lv"),
  email: z.object({
    provider: z.enum(["brevo", "mailjet", "custom"]),
    host: z.string().trim().max(255).optional().nullable(),
    port: z.number().int().min(1).max(65_535).optional().nullable(),
    secure: z.boolean().optional().nullable(),
    username: z.string().trim().min(1).max(500),
    password: z.string().min(1).max(500),
    fromAddress: z.email().max(320),
    fromName: z.string().trim().min(1).max(160),
  }),
  owner: z.object({
    firstName: z.string().trim().min(1).max(100),
    lastName: z.string().trim().min(1).max(100),
    company: z.string().trim().min(1).max(180),
    email: z.email().max(320),
    phone: z.string().trim().min(8).max(32),
  }),
});

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const input = schema.parse(await request.json());
    return NextResponse.json(await completeInstallation(input, requestMeta(request)), {
      status: 201,
      headers: { "cache-control": "no-store" },
    });
  } catch (error) {
    return jsonError(error, "The installation could not be completed.");
  }
}
