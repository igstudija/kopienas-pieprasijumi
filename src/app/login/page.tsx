import Link from "next/link";
import { redirect } from "next/navigation";
import { Brand } from "@/components/brand";
import { LoginChoices } from "@/components/login-choices";
import { installationStatus } from "@/lib/services/installation";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const status = await installationStatus();
  if (!status.installed) redirect("/setup");
  return <main className="auth-shell"><div className="auth-brand"><Brand /></div><section className="auth-card"><span className="auth-step">Droša piekļuve</span><h1>Prieks tevi<br />atkal redzēt.</h1><p>Datorā noskenē QR kodu. Telefonā nospied “Ieiet ar WhatsApp”.</p><LoginChoices /><small className="privacy-note">Sistēma pārbauda tikai administratora reģistrēto WhatsApp numuru. <Link href="/">Atpakaļ uz sākumu</Link></small></section><aside className="auth-aside"><blockquote>“Viens precīzs jautājums īstajiem cilvēkiem ir vērtīgāks par simts nejaušiem kontaktiem.”</blockquote><span>— kopienas princips</span></aside></main>;
}
