# Specific Requests

A self-hosted PWA for private business communities. Members publish precise introduction requests, while independent installations exchange only the entries their authors explicitly share.

Each community owns its GitHub copy, Vercel project, Supabase database and email provider account. There is no central SaaS database or shared authentication server.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Figstudija%2Fkopienas-pieprasijumi&project-name=kopienas-pieprasijumi&repository-name=kopienas-pieprasijumi&env=SETUP_SECRET&envDescription=Choose+a+unique+installation+secret+with+at+least+12+characters.+It+is+used+only+by+the+first-run+wizard.&envLink=https%3A%2F%2Fgithub.com%2Figstudija%2Fkopienas-pieprasijumi%2Fblob%2Fmain%2Fdocs%2FINSTALLATION.md&stores=%5B%7B%22type%22%3A%22integration%22%2C%22integrationSlug%22%3A%22supabase%22%2C%22productSlug%22%3A%22supabase%22%7D%5D)

## Installation

The complete Vercel + Supabase flow, SMTP preparation, upgrade notes and troubleshooting are in [docs/INSTALLATION.md](./docs/INSTALLATION.md).

In short:

1. deploy your own GitHub copy to Vercel;
2. choose a unique `SETUP_SECRET`;
3. connect a new or existing Supabase project;
4. let Vercel apply database migrations;
5. open `/setup` and connect Brevo, Mailjet or custom SMTP;
6. create the first owner and verify the SMTP test email.

Database credentials remain in Vercel Environment Variables. SMTP credentials are encrypted before storage in the installation database.

## Authentication and routes

- `/` is the only sign-in page and the authenticated request list.
- Every member, administrator and owner uses the same email magic-link flow.
- A link is valid for 10 minutes, can be used once and is stored only as an HMAC digest.
- Successful authentication reloads `/`; it does not send users to a separate application route.
- The user role changes only which links appear in the shared navigation.
- Administrators manage members, federation, SMTP and legal settings through the additional menu links.
- Phone numbers are contact data, not authentication credentials.
- Up to 500 members can be imported from `.xlsx`, `.xls` or `.csv`; email is required.

## Connecting independent installations

- Each administrator creates a one-time code for a specific peer.
- The issuer domain and identity are embedded in the code.
- Entering the other installation's code grants access to requests it shares with you.
- The other installation cannot see your requests until it enters the code you issue.
- If both sides exchange codes, sharing works in both directions.
- A code is valid for 24 hours and can be accepted only once.

## Local development

Requirements: Node.js 24.16.0, pnpm 10.20.0 and a Docker-compatible runtime such as OrbStack.

```bash
cp .env.example .env
docker compose up -d db
corepack pnpm install
corepack pnpm db:migrate
corepack pnpm db:seed
corepack pnpm dev
```

Open `http://localhost:3020`. The local seed owner uses `SEED_OWNER_EMAIL` and requests a magic link on `/`. Configure SMTP through `/setup`, the administrator email page, or the `SMTP_*` environment fallback.

## Federation keys

The production wizard creates a unique Ed25519 key pair per installation and stores the private key encrypted. For a manually seeded installation:

```bash
corepack pnpm exec tsx scripts/generate-federation-keys.ts
```

Never copy a private federation key to another installation.

## Quality checks

```bash
corepack pnpm check
corepack pnpm audit --audit-level high
```

See [docs/INSTALLATION.md](./docs/INSTALLATION.md), [docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md), [docs/CODE_REVIEW.md](./docs/CODE_REVIEW.md), and [docs/THREAT_MODEL.md](./docs/THREAT_MODEL.md).

## Licence

Copyright © 2026 Artis Čodars, Codars Design.

The source code is available under the [PolyForm Noncommercial License 1.0.0](./LICENSE). It may be used, copied, modified and distributed only for permitted noncommercial purposes. Commercial use requires a separate written commercial licence from Artis Čodars, Codars Design.
