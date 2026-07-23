import "server-only";

import nodemailer from "nodemailer";
import type { EmailTransportConfig } from "./email-config";
import { isCompleteEmailTransport } from "./email-config";

export type OutgoingEmail = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

export async function sendEmail(config: EmailTransportConfig, message: OutgoingEmail) {
  if (!isCompleteEmailTransport(config)) throw new Error("Email transport is incomplete.");
  const transport = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    requireTLS: !config.secure,
    auth: {
      user: config.username,
      pass: config.password,
    },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
    tls: {
      minVersion: "TLSv1.2",
    },
  });

  await transport.sendMail({
    from: { name: config.fromName, address: config.fromAddress },
    to: message.to,
    subject: message.subject,
    text: message.text,
    html: message.html,
  });
}
