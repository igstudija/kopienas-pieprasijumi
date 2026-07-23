import "server-only";

import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { instanceSettings, type User } from "@/lib/db/schema";
import {
  emailProviderDefaults,
  isCompleteEmailTransport,
  resolveEmailTransport,
  type EmailProvider,
  type EmailTransportConfig,
} from "@/lib/email-config";
import { HttpError } from "@/lib/http";
import { smtpTestEmail } from "@/lib/magic-link-email";
import { sendEmail } from "@/lib/mailer";
import { decryptSecret, encryptSecret, normalizeEmail } from "@/lib/security";
import type { Locale } from "@/lib/i18n";
import { writeAudit } from "./audit";

type AuditMeta = { ipAddress?: string | null; requestId?: string | null };

export type EmailSettingsInput = {
  provider: EmailProvider;
  host?: string | null;
  port?: number | null;
  secure?: boolean | null;
  username?: string | null;
  password?: string | null;
  fromAddress: string;
  fromName: string;
};

export async function getEmailAdminSettings() {
  const [settings] = await getDb().select().from(instanceSettings).limit(1);
  if (!settings) throw new HttpError(409, "Installation is not complete.");
  const provider = parseProvider(settings.emailProvider ?? process.env.SMTP_PROVIDER);
  const preset = emailProviderDefaults[provider];
  return {
    provider,
    host: settings.smtpHost ?? process.env.SMTP_HOST ?? preset.host,
    port: settings.smtpPort ?? numberFromEnvironment("SMTP_PORT") ?? preset.port,
    secure: settings.smtpPort ? settings.smtpSecure : booleanFromEnvironment("SMTP_SECURE") ?? preset.secure,
    usernameConfigured: Boolean(settings.smtpUsernameEncrypted || process.env.SMTP_USERNAME),
    passwordConfigured: Boolean(settings.smtpPasswordEncrypted || process.env.SMTP_PASSWORD),
    fromAddress: settings.emailFromAddress ?? process.env.SMTP_FROM_EMAIL ?? "",
    fromName: settings.emailFromName ?? process.env.SMTP_FROM_NAME ?? settings.name,
  };
}

export async function updateEmailAdminSettings(
  actor: User,
  input: EmailSettingsInput,
  audit: AuditMeta,
) {
  assertAdministrator(actor);
  const db = getDb();
  const [settings] = await db.select().from(instanceSettings).limit(1);
  if (!settings) throw new HttpError(409, "Installation is not complete.");
  const providerChanged = parseProvider(settings.emailProvider) !== input.provider;
  const currentUsername = providerChanged ? "" : decryptStoredOrEnvironment(settings.smtpUsernameEncrypted, "SMTP_USERNAME");
  const currentPassword = providerChanged ? "" : decryptStoredOrEnvironment(settings.smtpPasswordEncrypted, "SMTP_PASSWORD");
  const config = resolveEmailTransport({
    ...input,
    username: input.username?.trim() || currentUsername,
    password: input.password || currentPassword,
    fromAddress: normalizeEmail(input.fromAddress),
  });
  assertEmailTransport(config);

  await db.transaction(async (tx) => {
    await tx.update(instanceSettings).set({
      emailProvider: config.provider,
      smtpHost: config.host,
      smtpPort: config.port,
      smtpSecure: config.secure,
      smtpUsernameEncrypted: encryptSecret(config.username),
      smtpPasswordEncrypted: encryptSecret(config.password),
      emailFromAddress: config.fromAddress,
      emailFromName: config.fromName,
      updatedAt: new Date(),
    }).where(eq(instanceSettings.id, settings.id));
    await writeAudit(tx, {
      actorUserId: actor.id,
      action: "instance.email_settings_updated",
      objectType: "instance",
      objectId: settings.id,
      details: {
        provider: config.provider,
        host: config.host,
        port: config.port,
        secure: config.secure,
        credentialsChanged: Boolean(input.username?.trim() || input.password || providerChanged),
      },
      ipAddress: audit.ipAddress,
      requestId: audit.requestId,
    });
  });
  return getEmailAdminSettings();
}

export async function sendEmailSettingsTest(
  actor: User,
  to: string,
  locale: Locale,
  audit: AuditMeta,
) {
  assertAdministrator(actor);
  const email = normalizeEmail(to);
  const runtime = await getEmailTransport();
  const [settings] = await getDb().select({ id: instanceSettings.id, name: instanceSettings.name }).from(instanceSettings).limit(1);
  if (!settings) throw new HttpError(409, "Installation is not complete.");
  await sendEmail(runtime, { to: email, ...smtpTestEmail(locale, settings.name) });
  await writeAudit(getDb(), {
    actorUserId: actor.id,
    action: "instance.email_test_sent",
    objectType: "instance",
    objectId: settings.id,
    details: { provider: runtime.provider },
    ipAddress: audit.ipAddress,
    requestId: audit.requestId,
  });
}

export async function getEmailTransport(): Promise<EmailTransportConfig> {
  const [settings] = await getDb().select().from(instanceSettings).limit(1);
  if (!settings) throw new HttpError(503, "E-pasta nosūtīšana nav konfigurēta.");
  const provider = parseProvider(settings.emailProvider ?? process.env.SMTP_PROVIDER);
  const preset = emailProviderDefaults[provider];
  const config = resolveEmailTransport({
    provider,
    host: settings.smtpHost ?? process.env.SMTP_HOST ?? preset.host,
    port: settings.smtpPort ?? numberFromEnvironment("SMTP_PORT") ?? preset.port,
    secure: settings.smtpPort ? settings.smtpSecure : booleanFromEnvironment("SMTP_SECURE") ?? preset.secure,
    username: decryptStoredOrEnvironment(settings.smtpUsernameEncrypted, "SMTP_USERNAME"),
    password: decryptStoredOrEnvironment(settings.smtpPasswordEncrypted, "SMTP_PASSWORD"),
    fromAddress: settings.emailFromAddress ?? process.env.SMTP_FROM_EMAIL ?? "",
    fromName: settings.emailFromName ?? process.env.SMTP_FROM_NAME ?? settings.name,
  });
  assertEmailTransport(config);
  return config;
}

export function assertEmailTransport(config: EmailTransportConfig) {
  if (!isCompleteEmailTransport(config)) throw new HttpError(503, "E-pasta nosūtīšana nav pilnībā konfigurēta.");
  if (!/^[a-z0-9.-]+$/i.test(config.host) || config.host.startsWith(".") || config.host.endsWith(".")) {
    throw new HttpError(400, "SMTP servera nosaukums nav derīgs.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.fromAddress)) {
    throw new HttpError(400, "Sūtītāja e-pasta adrese nav derīga.");
  }
}

function parseProvider(value?: string | null): EmailProvider {
  return value === "mailjet" || value === "custom" ? value : "brevo";
}

function decryptStoredOrEnvironment(encrypted: string | null, environmentName: string) {
  return encrypted ? decryptSecret(encrypted) : process.env[environmentName] ?? "";
}

function numberFromEnvironment(name: string) {
  const value = Number(process.env[name]);
  return Number.isInteger(value) && value > 0 && value <= 65535 ? value : null;
}

function booleanFromEnvironment(name: string) {
  const value = process.env[name]?.trim().toLowerCase();
  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return false;
  return null;
}

function assertAdministrator(actor: User) {
  if (actor.role === "member") throw new HttpError(403, "Insufficient permissions.");
}
