export async function register() {
  const hasDatabase = Boolean(process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? process.env.POSTGRES_PRISMA_URL);
  if (!hasDatabase || process.env.VERCEL || process.env.NEXT_RUNTIME !== "nodejs" || process.env.DISABLE_FEDERATION_WORKER === "true") return;
  const state = globalThis as typeof globalThis & { communityFederationWorker?: ReturnType<typeof setInterval> };
  if (state.communityFederationWorker) return;
  const { dispatchFederationOutbox } = await import("@/lib/services/federation-dispatch");
  const run = () => dispatchFederationOutbox().catch((error) => console.error("Federācijas outbox kļūda", error));
  state.communityFederationWorker = setInterval(run, 5_000);
  state.communityFederationWorker.unref();
  setTimeout(run, 1_000).unref();
}
