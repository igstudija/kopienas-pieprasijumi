"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type QrLogin = { challengeId: string; browserToken: string; deepLink: string; qrDataUrl: string; expiresAt: string };

export function LoginChoices() {
  const router = useRouter();
  const [qr, setQr] = useState<QrLogin | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false; let timeout: ReturnType<typeof setTimeout>;
    async function start() {
      setError("");
      const response = await fetch("/api/v1/auth/qr/start", { method: "POST" });
      const data = await response.json();
      if (!response.ok) { setError(data.error ?? "QR neizdevās izveidot."); return; }
      if (!cancelled) { setQr(data); poll(data); }
    }
    async function poll(value: QrLogin) {
      if (cancelled) return;
      const response = await fetch("/api/v1/auth/qr/status", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ challengeId: value.challengeId, browserToken: value.browserToken }) });
      const data = await response.json();
      if (data.status === "complete") { router.push("/app"); router.refresh(); return; }
      if (data.status === "expired" || data.status === "invalid") { setError("QR koda termiņš ir beidzies. Izveido jaunu kodu."); return; }
      timeout = setTimeout(() => poll(value), 1500);
    }
    void start();
    return () => { cancelled = true; clearTimeout(timeout); };
  }, [router]);

  return <div className="qr-login">{qr ? <><div className="qr-frame"><Image src={qr.qrDataUrl} width={240} height={240} unoptimized alt="WhatsApp autorizācijas QR kods" /></div><ol><li>Noskenē QR ar telefona kameru</li><li>WhatsApp nospied “Sūtīt”</li><li>Šī lapa tevi ielaidīs automātiski</li></ol><a className="button button-accent button-wide mobile-whatsapp" href={qr.deepLink}>Ieiet ar WhatsApp</a></> : <div className="qr-loading"><span /><p>Veidojam drošu WhatsApp ieeju…</p></div>}{error && <div className="form-error">{error}</div>}</div>;
}
