import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertSameOrigin, jsonError, requestMeta } from "@/lib/http";
import { currentUserFromRequest } from "@/lib/services/auth";
import { importUsers } from "@/lib/services/users";

const importSchema = z.object({
  rows: z.array(z.object({
    rowNumber: z.number().int().min(2).max(100_000),
    firstName: z.string().max(500),
    lastName: z.string().max(500),
    company: z.string().max(500),
    category: z.string().max(500).optional().nullable(),
    phone: z.string().max(100),
    email: z.string().max(500),
  })).min(1).max(500),
});

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const actor = await currentUserFromRequest(request);
    if (!actor || actor.role === "member") {
      return NextResponse.json({ error: "Nepietiekamas tiesības." }, { status: 403 });
    }
    const { rows } = importSchema.parse(await request.json());
    return NextResponse.json(await importUsers(actor, rows, requestMeta(request)));
  } catch (error) {
    return jsonError(error, "Biedrus neizdevās importēt.");
  }
}
