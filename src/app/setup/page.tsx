import { redirect } from "next/navigation";
import { AppNavigation } from "@/components/app-navigation";
import { SetupWizard } from "@/components/setup-wizard";
import { installationStatus } from "@/lib/services/installation";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const status = await installationStatus();
  if (status.installed) redirect("/");

  return (
    <main className="setup-shell">
      <AppNavigation title="Installation setup" installationMode />
      <SetupWizard initialStatus={status} />
    </main>
  );
}
