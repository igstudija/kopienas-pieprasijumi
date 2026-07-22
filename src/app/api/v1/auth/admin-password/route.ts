import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertSameOrigin, jsonError, requestMeta } from "@/lib/http";
import { attachSessionCookie } from "@/lib/services/auth";
import { loginAdminWithPassword } from "@/lib/services/admin-password-auth";

const schema = z.object({
  phone: z.string().trim().min(6).max(32),
  password: z.string().min(1).max(200),
});

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const input = schema.parse(await request.json());
    const login = await loginAdminWithPassword(input.phone, input.password, requestMeta(request));
    const response = NextResponse.json({ ok: true }, { headers: { "cache-control": "no-store" } });
    attachSessionCookie(response, login.rawSessionToken, login.expiresAt);
    return response;
  } catch (error) {
    return jsonError(error, "Administratora autorizācija neizdevās.");
  }
}
