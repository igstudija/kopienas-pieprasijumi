import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertSameOrigin, jsonError, requestMeta } from "@/lib/http";
import { attachSessionCookie } from "@/lib/services/auth";
import { confirmEmailMagicLink } from "@/lib/services/email-magic-link-auth";

const schema = z.object({
  token: z.string().min(40).max(100),
});

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const input = schema.parse(await request.json());
    const login = await confirmEmailMagicLink(input.token, requestMeta(request));
    const response = NextResponse.json(
      { ok: true },
      { headers: { "cache-control": "no-store" } },
    );
    attachSessionCookie(response, login.rawSessionToken, login.expiresAt);
    return response;
  } catch (error) {
    return jsonError(error, "Ieiešanas saiti neizdevās apstiprināt.");
  }
}
