import { notFound, redirect } from "next/navigation";
import { RequestEditPageClient } from "@/components/request-edit-page-client";
import { currentUserFromPage } from "@/lib/services/auth";
import { getOwnRequestForEdit } from "@/lib/services/requests";

export const dynamic = "force-dynamic";

export default async function EditRequestPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await currentUserFromPage();
  if (!user) redirect("/");
  const { id } = await params;
  const request = await getOwnRequestForEdit(user, id);
  if (!request) notFound();
  return <RequestEditPageClient request={request} />;
}
