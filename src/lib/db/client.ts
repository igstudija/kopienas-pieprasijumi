import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { databaseUrl } from "@/lib/env";
import * as schema from "./schema";

function createClient() {
  return postgres(databaseUrl(), {
    max: process.env.NODE_ENV === "production" ? 10 : 3,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
  });
}

function createDatabase(client: ReturnType<typeof postgres>) {
  return drizzle(client, { schema });
}

const globalForDb = globalThis as unknown as {
  communitySql?: ReturnType<typeof postgres>;
  communityDb?: ReturnType<typeof createDatabase>;
};

export function getDb() {
  globalForDb.communitySql ??= createClient();
  globalForDb.communityDb ??= createDatabase(globalForDb.communitySql);
  return globalForDb.communityDb;
}
