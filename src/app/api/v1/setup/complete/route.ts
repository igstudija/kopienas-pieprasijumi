import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertSameOrigin, jsonError, requestMeta } from "@/lib/http";
import { completeInstallation } from "@/lib/services/installation";

const schema = z.object({
  setupPassword: z.string().min(12, "Instalācijas parolei jābūt vismaz 12 rakstzīmes garai.").max(200),
  instanceName: z.string().trim().min(2, "Ievadi grupas nosaukumu.").max(160),
  timezone: z.string().trim().min(1).max(80).default("Europe/Riga"),
  locale: z.enum(["lv", "en"]).default("lv"),
  whatsappBusinessNumber: z.string().trim().min(8).max(32),
  whatsappAppSecret: z.string().trim().min(8, "Ievadi Meta App Secret.").max(500),
  owner: z.object({
    firstName: z.string().trim().min(1, "Ievadi administratora vārdu.").max(100),
    lastName: z.string().trim().min(1, "Ievadi administratora uzvārdu.").max(100),
    company: z.string().trim().min(1, "Ievadi uzņēmuma nosaukumu.").max(180),
    email: z.email("Ievadi derīgu e-pastu.").max(320).optional().or(z.literal("")),
    phone: z.string().trim().min(8).max(32),
    password: z.string().min(12, "Admina parolei jābūt vismaz 12 rakstzīmes garai.").max(200),
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
    return jsonError(error, "Instalāciju neizdevās pabeigt.");
  }
}
