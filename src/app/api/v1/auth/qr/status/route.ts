import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertSameOrigin, jsonError, requestMeta } from "@/lib/http";
import { attachSessionCookie } from "@/lib/services/auth";
import { pollWhatsappQrLogin } from "@/lib/services/whatsapp-qr-auth";

const schema = z.object({ challengeId: z.uuid(), browserToken: z.string().min(30).max(100) });
export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const input = schema.parse(await request.json());
    const result = await pollWhatsappQrLogin(input.challengeId, input.browserToken, requestMeta(request));
    const response = NextResponse.json({ status: result.status, redirectTo: result.status === "complete" ? "/app" : undefined });
    if (result.status === "complete") attachSessionCookie(response, result.rawSessionToken, result.expiresAt);
    return response;
  } catch (error) { return jsonError(error, "QR statusu neizdevās pārbaudīt."); }
}
