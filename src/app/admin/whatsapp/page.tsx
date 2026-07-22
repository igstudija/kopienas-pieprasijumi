import { WhatsappAdminClient } from "@/components/whatsapp-admin-client";

export default function WhatsappAdminPage() {
  return <main className="app-main"><header className="app-heading"><div><span className="auth-step">Installation guide</span><h1>WhatsApp integration.</h1></div></header><WhatsappAdminClient /></main>;
}
