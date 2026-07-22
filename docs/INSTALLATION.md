# Vercel + Supabase installation

This procedure creates a fully independent installation. Existing installations continue operating in their owners' Vercel and Supabase accounts even if the original project maintainer stops providing any infrastructure.

## What the installation owner controls

- the GitHub repository copy;
- the Vercel project and domain;
- the Supabase organisation, project and PostgreSQL database;
- all member and request data;
- the Meta app and WhatsApp Business number;
- the installation's federation private key.

## Option A — recommended Deploy button

The distributor configures the public template URL in `NEXT_PUBLIC_TEMPLATE_REPOSITORY_URL`. The application's `/help/install` page then builds a Vercel Deploy URL that requests:

- a GitHub repository copy;
- the required `SETUP_SECRET` environment variable;
- a Supabase Marketplace product;
- default project and repository names.

Installation steps:

1. Click **Start the recommended installation**.
2. Sign in to Vercel and allow it to create the GitHub repository copy.
3. Enter a unique value with at least 12 characters in `SETUP_SECRET`. This is not the Supabase password.
4. Approve the Supabase product, plan and the nearest suitable European region.
5. Click **Deploy**.
6. When the deployment completes, open the new application URL.
7. The empty installation redirects to `/setup` automatically.
8. Enter the community, WhatsApp Business number, Meta App Secret, first administrator and a 12+ character administrator password.
9. In the final step, copy the Meta webhook Callback URL and Verify token.

The Vercel build runs `pnpm db:migrate` before the Next.js build, so database tables are created automatically.

## Option B — add Supabase after deployment

If the Supabase product is not shown in the Deploy screen:

1. Finish creating the Vercel project from the GitHub copy.
2. Open **Storage** in the Vercel project.
3. Select **Create Database → Supabase → Install**.
4. Choose the plan and region, create the resource and connect it to this Vercel project.
5. Open **Project Settings → Environment Variables** and add `SETUP_SECRET`.
6. Open **Deployments** and redeploy the latest deployment.
7. Open the application and complete `/setup`.

Connecting the Marketplace resource synchronises variables such as `POSTGRES_URL`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_SECRET_KEY` into the Vercel project. A resource added after a deployment requires a redeploy.

## Option C — existing Supabase project

1. Import your GitHub copy into Vercel.
2. Under **Project Settings → Environment Variables**, add:
   - `DATABASE_URL` or `POSTGRES_URL` — the pooled Supabase PostgreSQL connection string;
   - `SUPABASE_SECRET_KEY` — a server-side secret that must never be exposed to the browser;
   - `SETUP_SECRET` — your unique first-run installation secret.
3. Make the values available to the Production environment.
4. Redeploy.
5. Open `/setup`.

Never prefix `SUPABASE_SECRET_KEY`, `DATABASE_URL` or `POSTGRES_URL` with `NEXT_PUBLIC_`.

## First-run wizard

The wizard:

1. checks the database connection and `SETUP_SECRET`;
2. stores the community name, language, time zone and public installation URL;
3. encrypts the WhatsApp App Secret and creates an encrypted webhook Verify token;
4. creates the first active user with the `owner` role;
5. stores only the first administrator's scrypt password hash;
6. generates an Ed25519 federation key pair and encrypts the private key.

After an `instance_settings` record exists, public reinstallation is blocked. You may remove `SETUP_SECRET` from Vercel Environment Variables after setup, then redeploy.

## Meta and WhatsApp preparation

Before running the wizard, prepare:

1. a Meta Business account;
2. a Business-type Meta for Developers app with the WhatsApp product;
3. a connected WhatsApp Business number;
4. the app's **App Secret**.

After the wizard:

1. open the webhook settings in the Meta WhatsApp configuration;
2. paste the Callback URL shown by the wizard;
3. paste the Verify token;
4. subscribe to the `messages` webhook field;
5. open `/` and test the QR/deep-link authentication flow.

The same instructions and current configuration status are available to administrators at `/admin/whatsapp`.

## Where secrets are stored

| Value | Storage location |
| --- | --- |
| PostgreSQL credentials | Vercel Environment Variables |
| Supabase server secret | Vercel Environment Variables |
| `SETUP_SECRET` | Vercel Environment Variables, only for first-run protection |
| Administrator passwords | scrypt hashes only, in the instance database |
| WhatsApp App Secret | encrypted in the instance database |
| WhatsApp Verify token | encrypted in the instance database |
| Federation private key | encrypted in the instance database |
| Community data and users | the instance's Supabase database |

The encryption key is derived from `INSTANCE_MASTER_KEY` when configured. Otherwise, the application derives it from a server-side Supabase/Vercel database credential. If credential rotation is planned, configure a stable `INSTANCE_MASTER_KEY` before storing encrypted data. Do not change it later without a key migration.

## Local development

Requirements: Node.js 22+, pnpm 10+ and Docker or a compatible runtime such as OrbStack.

```bash
cp .env.example .env
docker compose up -d db
pnpm install
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Open `http://localhost:3020`. See the local credential notes in the root [README](../README.md).

## Troubleshooting

### The wizard says that the database is not connected

- Confirm that the Supabase resource is connected to this exact Vercel project.
- Confirm that `POSTGRES_URL`, `POSTGRES_PRISMA_URL` or `DATABASE_URL` exists.
- Redeploy after connecting the integration.

### The wizard says that the installation secret is missing

- Add `SETUP_SECRET` under **Project Settings → Environment Variables** for the Production environment.
- Redeploy.

### The build fails during migrations

- Verify the database connection string.
- Use the pooled Supabase connection string in a serverless environment.
- Confirm that the database user may create tables and enum types.

### WhatsApp webhook verification fails

- Use the exact Callback URL shown by the wizard or `/admin/whatsapp`.
- The Verify token is case-sensitive.
- The App Secret configured in the installation must belong to the same Meta app.
- Subscribe the WhatsApp Business Account to the `messages` field.

### An administrator cannot sign in at `/admin`

- Use the full phone number registered in the administrator profile, including the country code.
- Password login works only for active `owner` and `admin` roles; members use WhatsApp.
- Five failed attempts block the same phone/IP combination for 15 minutes.
- For a seeded local installation, check `SEED_OWNER_PHONE` and `SEED_OWNER_PASSWORD` in `.env`.

## Production checklist

- use HTTPS and a verified public domain;
- use unique production secrets and a stable `INSTANCE_MASTER_KEY`;
- verify Meta webhook signatures and a real WhatsApp login;
- set the legal entity and privacy contact in `/admin`;
- review the default privacy notice for the operator's actual processing;
- define backup, restore, incident-response and retention procedures;
- run `pnpm check` and `pnpm audit --audit-level high`;
- consider WebAuthn or another second factor for Owner/Admin accounts.
