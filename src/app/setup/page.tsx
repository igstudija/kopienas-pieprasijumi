import { redirect } from "next/navigation";
import { Brand } from "@/components/brand";
import { SetupWizard } from "@/components/setup-wizard";
import { installationStatus } from "@/lib/services/installation";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const status = await installationStatus();
  if (status.installed) redirect("/");

  return (
    <main className="setup-shell">
      <header className="setup-header"><Brand /><span>Independent instance installation</span></header>
      <SetupWizard initialStatus={status} />
    </main>
  );
}
