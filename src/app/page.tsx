import { redirect } from "next/navigation";
import { installationStatus } from "@/lib/services/installation";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const status = await installationStatus();
  redirect(status.installed ? "/login" : "/setup");
}
