# Specific Requests

Specific Requests is a self-hosted web application for private business communities. Members publish precise introduction requests, manage their own contact details, and can contact one another by email, phone, WhatsApp or website. Independent installations can exchange only the requests their authors explicitly share.

Each community owns its GitHub repository, Vercel project, Supabase database and SMTP provider account. There is no central SaaS database, shared authentication service or dependency on the template owner.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Figstudija%2Fkopienas-pieprasijumi&project-name=kopienas-pieprasijumi&repository-name=kopienas-pieprasijumi&env=SETUP_SECRET&envDescription=Choose+a+unique+installation+secret+with+at+least+12+characters.+You+will+enter+it+once+in+the+first-run+wizard.&envLink=https%3A%2F%2Fgithub.com%2Figstudija%2Fkopienas-pieprasijumi%2Fblob%2Fmain%2Fdocs%2FINSTALLATION.md)

## Recommended installation

The deployment is intentionally split into three simple stages:

1. use the button above to create your own GitHub copy and Vercel project;
2. connect a Supabase database to that Vercel project and redeploy;
3. open `/setup`, connect SMTP and create the first owner.

The initial Vercel build succeeds even before a database is connected. Once `POSTGRES_URL`, `DATABASE_URL` or `POSTGRES_PRISMA_URL` is available, the Vercel build applies all committed Drizzle migrations before building the application.

Follow the complete [installation guide](./docs/INSTALLATION.md). It includes Supabase connection options, Brevo and Mailjet values, local development, upgrades and troubleshooting.

## Product behavior

- `/` is both the public email sign-in page and the authenticated request list.
- `/help` is an authenticated operator center available only to administrators and owners.
- `/help/install` is the public English first-run installation guide and remains available before the database is connected.
- Every member, administrator and owner uses the same one-time email magic-link flow.
- A sign-in link expires after 10 minutes, works once and is stored only as an HMAC digest.
- The role controls which administration links are visible; there is no separate administrator password login.
- The installation language is selected centrally in `/admin/settings` and supports Latvian, English, Lithuanian and Estonian.
- Phone numbers are contact data stored in international E.164 format. They power phone and WhatsApp contact actions but are not authentication credentials.
- Members may add an optional website. Contact icons are shown only when the corresponding value exists and is valid.
- Administrators can create, edit, deactivate, reactivate, delete, search and import members.
- Spreadsheet import accepts `.xlsx`, `.xls` and `.csv`, up to 500 members at once.

## Connecting independent installations

Federation is direct and one-way for each accepted code:

1. an administrator creates a code for one specific peer;
2. the code contains the issuing installation identity and canonical domain;
3. the receiving installation enters the code and can receive requests shared with it;
4. the issuer cannot receive requests in the opposite direction until it accepts a code created by the other installation.

Pairing codes expire after 24 hours and can be accepted once. Long-term event delivery uses Ed25519 signatures, replay protection and explicit peer identity checks. An installation never forwards records received from another peer.

## Local development

Requirements:

- Node.js `24.16.0`;
- pnpm `10.20.0` through Corepack;
- OrbStack, Docker Desktop or another Docker-compatible runtime.

```bash
cp .env.example .env
docker compose up -d db
corepack pnpm install
corepack pnpm db:migrate
corepack pnpm db:seed
corepack pnpm dev
```

Open `http://localhost:3020`. In local development, the sign-in page provides a development-only administrator button, so SMTP is not required. The endpoint is unavailable in production.

## Deployment and upgrades

Vercel uses:

```text
pnpm vercel-build
```

The command:

1. applies forward-only migrations when database credentials are present;
2. skips migration with a clear warning when the database has not been connected yet;
3. always runs the production Next.js build.

Operational steps, backup guidance, rollback boundaries and the production checklist are in [docs/OPERATIONS.md](./docs/OPERATIONS.md).

## Quality gates

```bash
corepack pnpm check
corepack pnpm audit --audit-level high
```

`pnpm check` runs ESLint, TypeScript, Vitest and the production build. GitHub Actions runs the same frozen-install quality gate for pull requests, pushes to `main`, manual runs and the scheduled weekly dependency check.

## Documentation

- [Installation guide](./docs/INSTALLATION.md)
- [Operations and upgrades](./docs/OPERATIONS.md)
- [Architecture](./ARCHITECTURE.md)
- [Development workflow](./docs/DEVELOPMENT.md)
- [Code review checklist](./docs/CODE_REVIEW.md)
- [Threat model](./docs/THREAT_MODEL.md)
- [Contributing](./CONTRIBUTING.md)
- [Security policy](./SECURITY.md)

All installation help, repository documentation, workflow descriptions, identifiers and code comments are maintained in English. Product UI copy remains available in all four supported installation languages.

## Licence

Copyright © 2026 Artis Čodars, Codars Design.

The source code is available under the [PolyForm Noncommercial License 1.0.0](./LICENSE). It may be used, copied, modified and distributed only for permitted noncommercial purposes. Commercial use requires a separate written commercial licence from Artis Čodars, Codars Design.
