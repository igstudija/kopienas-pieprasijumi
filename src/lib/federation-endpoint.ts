import { lookup } from "node:dns/promises";
import { BlockList, isIP } from "node:net";
import { HttpError } from "./http";

const HANDSHAKE_PATH = "/api/v1/federation/handshake";
const MAX_URL_LENGTH = 2048;
const blockedAddresses = new BlockList();

for (const [network, prefix] of [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
] as const) blockedAddresses.addSubnet(network, prefix, "ipv4");

for (const [network, prefix] of [
  ["::", 128],
  ["::1", 128],
  ["fc00::", 7],
  ["fe80::", 10],
  ["ff00::", 8],
  ["2001:db8::", 32],
] as const) blockedAddresses.addSubnet(network, prefix, "ipv6");

type ResolvedAddress = { address: string; family: number };
type ValidationOptions = {
  allowLocalDevelopment?: boolean;
  resolveHostname?: (hostname: string) => Promise<readonly ResolvedAddress[]>;
};

export async function validateFederationHandshakeEndpoint(value: string, options?: ValidationOptions) {
  return validateFederationUrl(value, HANDSHAKE_PATH, options);
}

export async function validateFederationBaseUrl(value: string, options?: ValidationOptions) {
  return validateFederationUrl(value, "/", options);
}

async function validateFederationUrl(value: string, expectedPath: string, options: ValidationOptions = {}) {
  if (!value || value.length > MAX_URL_LENGTH) throw new HttpError(400, "Federācijas adrese nav derīga.");
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new HttpError(400, "Federācijas adrese nav derīga.");
  }

  const hostname = normalizeHostname(url.hostname);
  const allowLocalDevelopment = options.allowLocalDevelopment ?? process.env.NODE_ENV !== "production";
  const localDevelopmentUrl = allowLocalDevelopment && isLoopbackHostname(hostname) && url.protocol === "http:";
  if (url.protocol !== "https:" && !localDevelopmentUrl) throw new HttpError(400, "Federācijas adresei jāizmanto HTTPS.");
  if (url.username || url.password) throw new HttpError(400, "Federācijas adrese nedrīkst saturēt lietotājvārdu vai paroli.");
  if (url.pathname !== expectedPath || url.search || url.hash) throw new HttpError(400, "Federācijas adreses ceļš nav derīgs.");
  if (!localDevelopmentUrl) await assertPublicHostname(hostname, options.resolveHostname);
  return url;
}

async function assertPublicHostname(hostname: string, resolver?: ValidationOptions["resolveHostname"]) {
  if (isLoopbackHostname(hostname) || hostname.endsWith(".local") || hostname.endsWith(".internal") || hostname.endsWith(".home.arpa")) {
    throw new HttpError(400, "Federācijas adrese nedrīkst norādīt uz privātu tīklu.");
  }
  if (isIP(hostname)) {
    if (isBlockedFederationAddress(hostname)) throw new HttpError(400, "Federācijas adrese nedrīkst norādīt uz privātu tīklu.");
    return;
  }

  let addresses: readonly ResolvedAddress[];
  try {
    addresses = await (resolver ? resolver(hostname) : lookup(hostname, { all: true, verbatim: true }));
  } catch {
    throw new HttpError(400, "Federācijas domēnu neizdevās atrast.");
  }
  if (!addresses.length || addresses.some(({ address }) => isBlockedFederationAddress(address))) {
    throw new HttpError(400, "Federācijas domēns nedrīkst norādīt uz privātu tīklu.");
  }
}

export function isBlockedFederationAddress(input: string) {
  const address = normalizeHostname(input);
  const mappedIpv4 = address.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i)?.[1];
  if (mappedIpv4) return blockedAddresses.check(mappedIpv4, "ipv4");
  const family = isIP(address);
  if (family === 4) return blockedAddresses.check(address, "ipv4");
  if (family === 6) return blockedAddresses.check(address, "ipv6");
  return true;
}

function normalizeHostname(value: string) {
  return value.trim().toLowerCase().replace(/^\[|\]$/g, "").replace(/\.$/, "");
}

function isLoopbackHostname(hostname: string) {
  return hostname === "localhost" || hostname.endsWith(".localhost") || hostname === "127.0.0.1" || hostname === "::1";
}
