import { NextRequest, NextResponse } from "next/server";
import { assertSameOrigin, jsonError, requestMeta } from "@/lib/http";
import { startWhatsappQrLogin } from "@/lib/services/whatsapp-qr-auth";

export async function POST(request: NextRequest) {
  try { assertSameOrigin(request); return NextResponse.json(await startWhatsappQrLogin(requestMeta(request)), { status: 201 }); }
  catch (error) { return jsonError(error, "WhatsApp QR neizdevās izveidot."); }
}
