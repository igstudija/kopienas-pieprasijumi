"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type QrLogin = { challengeId: string; browserToken: string; deepLink: string; qrDataUrl: string; expiresAt: string };

export function LoginChoices() {
  const router = useRouter();
  const [qr, setQr] = useState<QrLogin | null>(null);
  const [error, setError] = useState("");
  const [canRetry, setCanRetry] = useState(false);
  const [restartKey, setRestartKey] = useState(0);

  useEffect(() => {
    let cancelled = false; let timeout: ReturnType<typeof setTimeout>;
    async function start() {
      setError("");
      setCanRetry(false);
      try {
        const response = await fetch("/api/v1/auth/qr/start", { method: "POST" });
        const data = await response.json();
        if (cancelled) return;
        if (!response.ok) {
          setError(data.error ?? "QR neizdevās izveidot.");
          setCanRetry(true);
          return;
        }
        setQr(data);
        poll(data);
      } catch {
        if (!cancelled) {
          setError("Neizdevās savienoties ar sistēmu.");
          setCanRetry(true);
        }
      }
    }
    async function poll(value: QrLogin) {
      if (cancelled) return;
      try {
        const response = await fetch("/api/v1/auth/qr/status", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ challengeId: value.challengeId, browserToken: value.browserToken }) });
        const data = await response.json();
        if (data.status === "complete") { router.push("/app"); router.refresh(); return; }
        if (data.status === "expired") {
          setQr(null);
          setError("QR koda termiņš beidzās. Veidojam jaunu kodu…");
          timeout = setTimeout(() => setRestartKey((current) => current + 1), 600);
          return;
        }
        if (data.status === "invalid") {
          setError("QR kodu neizdevās pārbaudīt.");
          setCanRetry(true);
          return;
        }
        timeout = setTimeout(() => poll(value), 1500);
      } catch {
        if (!cancelled) {
          setError("Neizdevās pārbaudīt QR kodu.");
          setCanRetry(true);
        }
      }
    }
    void start();
    return () => { cancelled = true; clearTimeout(timeout); };
  }, [restartKey, router]);

  function restart() {
    setQr(null);
    setError("");
    setCanRetry(false);
    setRestartKey((value) => value + 1);
  }

  return <div className="qr-login">{qr ? <><div className="qr-frame"><Image src={qr.qrDataUrl} width={240} height={240} unoptimized alt="WhatsApp autorizācijas QR kods" /></div><ol><li>Noskenē QR ar telefona kameru</li><li>WhatsApp nospied “Sūtīt”</li><li>Šī lapa tevi ielaidīs automātiski</li></ol><a className="button button-accent button-wide mobile-whatsapp" href={qr.deepLink}>Ieiet ar WhatsApp</a></> : <div className="qr-loading"><span /><p>Veidojam drošu WhatsApp ieeju…</p></div>}{error && <div className="form-error">{error}</div>}{canRetry && <button className="button button-dark button-wide" type="button" onClick={restart}>Izveidot jaunu QR kodu</button>}</div>;
}
