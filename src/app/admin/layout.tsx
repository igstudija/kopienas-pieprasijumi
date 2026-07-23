import { AuthenticatedAppShell } from "@/components/authenticated-app-shell";

export const dynamic = "force-dynamic";
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AuthenticatedAppShell administratorOnly>{children}</AuthenticatedAppShell>;
}
