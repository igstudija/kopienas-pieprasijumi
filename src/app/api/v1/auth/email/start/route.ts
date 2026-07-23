import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertSameOrigin, jsonError, requestMeta } from "@/lib/http";
import { requestEmailMagicLink } from "@/lib/services/email-magic-link-auth";
import { getInstanceLocale } from "@/lib/services/instance-settings";

const schema = z.object({
  email: z.email().max(320),
});

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const input = schema.parse(await request.json());
    await requestEmailMagicLink(input.email, await getInstanceLocale(), requestMeta(request));
    return NextResponse.json(
      { accepted: true },
      { status: 202, headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    return jsonError(error, "Ieiešanas saiti neizdevās nosūtīt.");
  }
}
