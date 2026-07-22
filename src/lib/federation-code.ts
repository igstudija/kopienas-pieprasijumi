export type PairingPayload = {
  endpoint: string;
  inviteId: string;
  secret: string;
  expiresAt: string;
  issuerName?: string;
  issuerBaseUrl?: string;
};

export type PairingCodePreview = {
  domain: string;
  issuerName: string | null;
  expiresAt: string;
};

export function decodePairingCode(code: string): PairingPayload {
  const normalized = code.trim().replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  const json = new TextDecoder().decode(Uint8Array.from(binary, (character) => character.charCodeAt(0)));
  const value = JSON.parse(json) as Partial<PairingPayload>;
  if (
    typeof value.endpoint !== "string"
    || typeof value.inviteId !== "string"
    || typeof value.secret !== "string"
    || typeof value.expiresAt !== "string"
  ) throw new Error("Savienošanas kods nav derīgs.");
  return value as PairingPayload;
}

export function pairingCodePreview(code: string): PairingCodePreview {
  const value = decodePairingCode(code);
  return {
    domain: new URL(value.endpoint).origin,
    issuerName: value.issuerName?.trim() || null,
    expiresAt: value.expiresAt,
  };
}
