import { spawnSync } from "node:child_process";

const pnpmCli = process.env.npm_execpath;
const databaseUrl = process.env.DATABASE_URL
  ?? process.env.POSTGRES_URL
  ?? process.env.POSTGRES_PRISMA_URL;

if (!pnpmCli) {
  throw new Error("The pnpm executable path is unavailable. Run this script through `pnpm vercel-build`.");
}

if (databaseUrl) {
  run(process.execPath, [pnpmCli, "db:migrate"]);
} else {
  console.warn("Database credentials are not connected yet. Skipping migrations so the setup help can be deployed.");
}

run(process.execPath, [pnpmCli, "build"]);

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: process.env,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
