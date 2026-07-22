import { NextResponse } from "next/server";
import { installationStatus } from "@/lib/services/installation";

export const dynamic = "force-dynamic";

export async function GET() {
  const status = await installationStatus();
  return NextResponse.json(status, {
    status: status.databaseConnected ? 200 : 503,
    headers: { "cache-control": "no-store" },
  });
}
