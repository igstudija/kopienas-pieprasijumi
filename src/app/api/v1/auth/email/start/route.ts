import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertSameOrigin, jsonError, requestMeta } from "@/lib/http";
import { requestEmailMagicLink } from "@/lib/services/email-magic-link-auth";

const schema = z.object({
  email: z.email().max(320),
  locale: z.enum(["lv", "en", "lt", "et"]).default("lv"),
});

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const input = schema.parse(await request.json());
    await requestEmailMagicLink(input.email, input.locale, requestMeta(request));
    return NextResponse.json(
      { accepted: true },
      { status: 202, headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    return jsonError(error, "Ieiešanas saiti neizdevās nosūtīt.");
  }
}
