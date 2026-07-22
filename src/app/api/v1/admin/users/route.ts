import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertSameOrigin, jsonError, requestMeta } from "@/lib/http";
import { currentUserFromRequest } from "@/lib/services/auth";
import { createUser, listUsers } from "@/lib/services/users";

const userSchema = z.object({
  firstName: z.string().trim().min(2).max(100),
  lastName: z.string().trim().min(2).max(100),
  company: z.string().trim().min(2).max(180),
  category: z.string().trim().max(180).optional().nullable(),
  phone: z.string().min(6).max(30),
  email: z.email().optional().nullable().or(z.literal("")),
  role: z.enum(["owner", "admin", "member"]).default("member"),
});

export async function GET(request: NextRequest) {
  try {
    const actor = await currentUserFromRequest(request);
    if (!actor || actor.role === "member") return NextResponse.json({ error: "Nepietiekamas tiesības." }, { status: 403 });
    return NextResponse.json({ users: await listUsers() });
  } catch (error) {
    return jsonError(error, "Lietotājus neizdevās ielādēt.");
  }
}

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const actor = await currentUserFromRequest(request);
    if (!actor || actor.role === "member") return NextResponse.json({ error: "Nepietiekamas tiesības." }, { status: 403 });
    const input = userSchema.parse(await request.json());
    const id = await createUser(actor, { ...input, email: input.email || null }, requestMeta(request));
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    return jsonError(error, "Lietotāju neizdevās izveidot.");
  }
}
