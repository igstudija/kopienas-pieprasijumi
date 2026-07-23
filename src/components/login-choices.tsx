"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, fetchJson, isAbortError, jsonRequest } from "@/lib/client-api";
import { WhatsAppIcon } from "./icons";
import { useLanguage } from "./language-provider";

type QrLogin = { challengeId: string; browserToken: string; deepLink: string; qrDataUrl: string; expiresAt: string };

export function LoginChoices() {
  const router = useRouter();
  const { messages } = useLanguage();
  const [qr, setQr] = useState<QrLogin | null>(null);
  const [error, setError] = useState("");
  const [canRetry, setCanRetry] = useState(false);
  const [restartKey, setRestartKey] = useState(0);

  useEffect(() => {
    let cancelled = false; let timeout: ReturnType<typeof setTimeout>;
    const controller = new AbortController();
    async function start() {
      setError("");
      setCanRetry(false);
      try {
        const data = await fetchJson<QrLogin>("/api/v1/auth/qr/start", { method: "POST", signal: controller.signal });
        if (cancelled) return;
        setQr(data);
        poll(data);
      } catch (cause) {
        if (!cancelled && !isAbortError(cause)) {
          setError(cause instanceof Error ? cause.message : "Neizdevās savienoties ar sistēmu.");
          setCanRetry(true);
          if (!(cause instanceof ApiError) || cause.status !== 429) {
            timeout = setTimeout(() => setRestartKey((current) => current + 1), 2500);
          }
        }
      }
    }
    async function poll(value: QrLogin) {
      if (cancelled) return;
      try {
        const data = await fetchJson<{ status: "pending" | "complete" | "expired" | "invalid" }>(
          "/api/v1/auth/qr/status",
          jsonRequest("POST", { challengeId: value.challengeId, browserToken: value.browserToken }, { signal: controller.signal }),
        );
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
          timeout = setTimeout(() => setRestartKey((current) => current + 1), 1500);
          return;
        }
        timeout = setTimeout(() => poll(value), 1500);
      } catch (cause) {
        if (!cancelled && !isAbortError(cause)) {
          setError("Neizdevās pārbaudīt QR kodu.");
          setCanRetry(true);
          timeout = setTimeout(() => poll(value), 2500);
        }
      }
    }
    void start();
    return () => { cancelled = true; controller.abort(); clearTimeout(timeout); };
  }, [restartKey, router]);

  function restart() {
    setQr(null);
    setError("");
    setCanRetry(false);
    setRestartKey((value) => value + 1);
  }

  return <div className="qr-login">{qr ? <><div className="qr-frame"><Image src={qr.qrDataUrl} width={240} height={240} unoptimized alt={messages.qrAlt} /><span className="qr-whatsapp-mark" aria-hidden="true"><WhatsAppIcon /></span></div><ol><li>{messages.qrStep1}</li><li>{messages.qrStep2}</li><li>{messages.qrStep3}</li></ol><a className="button button-accent button-wide mobile-whatsapp" href={qr.deepLink}>{messages.loginWhatsapp}</a></> : <div className="qr-loading"><span /><p>{messages.qrLoading}</p></div>}{error && <div className="form-error">{error}</div>}{canRetry && <button className="button button-dark button-wide" type="button" onClick={restart}>{messages.qrRetry}</button>}</div>;
}
