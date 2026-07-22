import { auditLog } from "@/lib/db/schema";

type AuditDb = Pick<ReturnType<typeof import("@/lib/db").getDb>, "insert">;

export async function writeAudit(
  db: AuditDb,
  input: {
    actorUserId?: string | null;
    action: string;
    objectType: string;
    objectId?: string | null;
    details?: Record<string, unknown>;
    ipAddress?: string | null;
    requestId?: string | null;
  },
) {
  await db.insert(auditLog).values({
    actorUserId: input.actorUserId ?? null,
    action: input.action,
    objectType: input.objectType,
    objectId: input.objectId ?? null,
    details: input.details ?? {},
    ipAddress: input.ipAddress ?? null,
    requestId: input.requestId ?? null,
  });
}
