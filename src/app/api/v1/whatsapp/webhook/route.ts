import { NextRequest, NextResponse } from "next/server";
import { extractWhatsappTextMessages } from "@/lib/whatsapp-webhook";
import { registerWhatsappLoginMessage, verifyWhatsappWebhookSignature } from "@/lib/services/whatsapp-qr-auth";
import { getInstanceRuntime } from "@/lib/services/installation";
import { safeEqualHex, sha256 } from "@/lib/security";

export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get("hub.mode");
  const token = request.nextUrl.searchParams.get("hub.verify_token");
  const challenge = request.nextUrl.searchParams.get("hub.challenge");
  const expectedToken = (await getInstanceRuntime()).whatsappWebhookVerifyToken;
  if (mode === "subscribe" && token && expectedToken && safeEqualHex(sha256(token), sha256(expectedToken)) && challenge) return new NextResponse(challenge, { status: 200 });
  return NextResponse.json({ error: "Webhook verifikācija neizdevās." }, { status: 403 });
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  if (!(await verifyWhatsappWebhookSignature(rawBody, request.headers.get("x-hub-signature-256")))) return NextResponse.json({ error: "Nederīgs webhook paraksts." }, { status: 401 });
  let payload: unknown;
  try { payload = JSON.parse(rawBody); } catch { return NextResponse.json({ error: "Nederīgs JSON." }, { status: 400 }); }
  await Promise.all(extractWhatsappTextMessages(payload).map((message) => registerWhatsappLoginMessage(message.from, message.text)));
  return NextResponse.json({ ok: true });
}
