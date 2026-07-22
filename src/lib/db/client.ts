import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { databaseUrl } from "@/lib/env";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { communitySql?: ReturnType<typeof postgres> };

function createClient() {
  return postgres(databaseUrl(), {
    max: process.env.NODE_ENV === "production" ? 10 : 3,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
  });
}

export function getDb() {
  const sql = globalForDb.communitySql ?? createClient();
  if (process.env.NODE_ENV !== "production") globalForDb.communitySql = sql;
  return drizzle(sql, { schema });
}
