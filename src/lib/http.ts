import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

export function clientIp(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? null;
}

export function requestMeta(request: NextRequest) {
  return {
    ipAddress: clientIp(request),
    userAgent: request.headers.get("user-agent"),
    requestId: request.headers.get("x-request-id") ?? crypto.randomUUID(),
  };
}

export function assertSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return;
  const expected = new URL(process.env.APP_URL ?? request.nextUrl.origin).origin;
  if (origin !== expected) throw new HttpError(403, "Nederīga pieprasījuma izcelsme.");
}

export function jsonError(error: unknown, fallback = "Pieprasījumu neizdevās izpildīt.") {
  if (error instanceof ZodError) {
    return NextResponse.json({ error: error.issues[0]?.message ?? fallback }, { status: 400 });
  }
  if (error instanceof HttpError) return NextResponse.json({ error: error.message }, { status: error.status });
  console.error(error);
  return NextResponse.json({ error: fallback }, { status: 500 });
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}
