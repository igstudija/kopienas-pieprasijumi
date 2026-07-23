export type EmailProvider = "brevo" | "mailjet" | "custom";

export type EmailTransportConfig = {
  provider: EmailProvider;
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  fromAddress: string;
  fromName: string;
};

export const emailProviderDefaults: Record<EmailProvider, Pick<EmailTransportConfig, "host" | "port" | "secure">> = {
  brevo: { host: "smtp-relay.brevo.com", port: 587, secure: false },
  mailjet: { host: "in-v3.mailjet.com", port: 587, secure: false },
  custom: { host: "", port: 587, secure: false },
};

export function resolveEmailTransport(input: {
  provider: EmailProvider;
  host?: string | null;
  port?: number | null;
  secure?: boolean | null;
  username: string;
  password: string;
  fromAddress: string;
  fromName: string;
}): EmailTransportConfig {
  const preset = emailProviderDefaults[input.provider];
  return {
    provider: input.provider,
    host: input.provider === "custom" ? input.host?.trim() ?? "" : preset.host,
    port: input.provider === "custom" ? input.port ?? preset.port : preset.port,
    secure: input.provider === "custom" ? Boolean(input.secure) : preset.secure,
    username: input.username.trim(),
    password: input.password,
    fromAddress: input.fromAddress.trim().toLowerCase(),
    fromName: input.fromName.trim(),
  };
}

export function isCompleteEmailTransport(config: EmailTransportConfig) {
  return Boolean(
    config.host
    && config.port > 0
    && config.port <= 65535
    && config.username
    && config.password
    && config.fromAddress
    && config.fromName,
  );
}
