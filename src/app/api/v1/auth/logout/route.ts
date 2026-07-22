import { NextRequest, NextResponse } from "next/server";
import { assertSameOrigin, jsonError, requestMeta } from "@/lib/http";
import { clearSessionCookie, logout } from "@/lib/services/auth";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    await logout(request, requestMeta(request));
    const response = NextResponse.json({ ok: true });
    clearSessionCookie(response);
    return response;
  } catch (error) {
    return jsonError(error);
  }
}
