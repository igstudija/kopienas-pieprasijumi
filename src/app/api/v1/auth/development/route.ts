import { NextRequest, NextResponse } from "next/server";
import { assertSameOrigin, jsonError, requestMeta } from "@/lib/http";
import { attachSessionCookie } from "@/lib/services/auth";
import {
  assertDevelopmentLoginAvailable,
  createDevelopmentAdminSession,
} from "@/lib/services/development-auth";

export async function POST(request: NextRequest) {
  try {
    assertDevelopmentLoginAvailable(request.nextUrl.hostname);
    assertSameOrigin(request);
    const login = await createDevelopmentAdminSession(requestMeta(request));
    const response = NextResponse.json(
      { ok: true },
      { headers: { "cache-control": "no-store" } },
    );
    attachSessionCookie(response, login.rawSessionToken, login.expiresAt);
    return response;
  } catch (error) {
    return jsonError(error, "Local development sign-in failed.");
  }
}
