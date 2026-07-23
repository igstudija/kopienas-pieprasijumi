# Installation guide

This application is not a central SaaS service. Every community runs an independent GitHub copy, Vercel project, Supabase database and SMTP account.

## Local development without SMTP

When the application runs with `pnpm dev` on `localhost`, the sign-in form includes a **Sign in as local administrator** button. It signs in the active owner or administrator selected by `DEV_ADMIN_EMAIL`. When that value is empty, it falls back to `SEED_OWNER_EMAIL`, and then to the first active owner or administrator.

If the local user does not exist, set `SEED_OWNER_EMAIL` and run `pnpm db:seed`. The development endpoint requires both `NODE_ENV=development` and a loopback hostname. It returns `404` in production and cannot replace SMTP sign-in in a deployed installation.

## Prepare before deployment

You need:

- a GitHub account;
- a Vercel account;
- a Supabase account;
- a Brevo, Mailjet or other SMTP account;
- a verified sender email or domain;
- a unique installation secret of at least 12 characters.

For the simplest setup, use Brevo or Mailjet. Create a dedicated SMTP key instead of using the password for your normal provider account.

## Recommended: Vercel button and Supabase integration

1. Open the **Deploy with Vercel** button in the repository README.
2. Choose the GitHub account that will own the copied repository.
3. Enter a unique `SETUP_SECRET`.
4. Approve the Supabase Marketplace product.
5. Select the Supabase plan and region.
6. Wait for the build and database migrations to finish.
7. Open the deployed URL. An empty installation opens `/setup`.
8. Complete the wizard:
   - community name, time zone and language;
   - email provider and SMTP credentials;
   - verified sender address and sender name;
   - owner name, company, sign-in email and contact phone;
   - the same `SETUP_SECRET` entered during deployment.
9. The wizard sends a real SMTP test to the owner email before it saves the installation.
10. Open `/`, enter the owner email and use the one-time link.

Vercel stores the database credentials in Environment Variables. They are not entered into the web wizard.

## If the Supabase step is missing

1. Deploy the GitHub copy to Vercel.
2. Open the Vercel project and choose **Storage → Create Database → Supabase**.
3. Create or connect a Supabase project.
4. Add `SETUP_SECRET` under **Project Settings → Environment Variables**.
5. Redeploy and open `/setup`.

For an existing Supabase project, add its pooled connection string as `DATABASE_URL` or `POSTGRES_URL`.

## SMTP provider values

### Brevo

- Provider: `Brevo`
- Host: `smtp-relay.brevo.com`
- Port: `587`
- Username: the SMTP login shown in Brevo
- Password: a generated SMTP key

Verify the sender under Brevo sender and domain settings first.

### Mailjet

- Provider: `Mailjet`
- Host: `in-v3.mailjet.com`
- Port: `587`
- Username: API Key
- Password: Secret Key

Verify the sender or domain in Mailjet first.

### Custom SMTP

Use the values supplied by the provider. Port `587` normally uses STARTTLS and leaves **Direct TLS/SSL** disabled. Port `465` normally uses direct TLS and enables that option.

## Where secrets are stored

| Value | Storage |
| --- | --- |
| Database credentials | Vercel Environment Variables |
| `SETUP_SECRET` | Vercel Environment Variables |
| SMTP username and password | AES-GCM encrypted in the installation database |
| Federation private key | AES-GCM encrypted in the installation database |
| Member phone | AES-GCM encrypted in the installation database |
| Magic-link token | only an HMAC digest in the database |
| Session token | only an HMAC digest in the database and an HttpOnly cookie in the browser |

The administration API returns only whether SMTP credentials are configured; it never returns the credentials themselves.

## Optional SMTP environment fallback

Existing installations can configure SMTP before the first email login by adding:

```text
SMTP_PROVIDER=brevo
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USERNAME=...
SMTP_PASSWORD=...
SMTP_FROM_EMAIL=...
SMTP_FROM_NAME=Specific requests
```

The administrator email page can later save the credentials encrypted in the database. Database values take precedence over environment fallback values.

## Upgrade from the former phone-based authentication

The upgrade removes the old application route, QR/webhook endpoints and administrator-password endpoint.

Before deploying:

1. make sure every active user has a unique email address;
2. configure the `SMTP_*` fallback values above, or keep an existing administrator session active and configure SMTP immediately after deployment;
3. apply the new database migration;
4. send a test email from **Administration → Email and authentication**;
5. verify that `/` sends and accepts a one-time link.

The authenticated request list is always at `/`. There is no `/app` compatibility redirect.

## Local development

Requirements:

- Node.js `24.16.0`;
- pnpm `10.20.0`;
- OrbStack, Docker Desktop or another Docker-compatible runtime.

```bash
cp .env.example .env
docker compose up -d db
corepack pnpm install
corepack pnpm db:migrate
corepack pnpm db:seed
corepack pnpm dev
```

The seed creates or updates the owner identified by `SEED_OWNER_EMAIL`. For real magic-link delivery, configure SMTP in the setup wizard or the `SMTP_*` variables.

## Troubleshooting

### The email is not received

- Check the Spam/Junk folder.
- Verify the sender or domain at the provider.
- Confirm that the SMTP username and dedicated key are correct.
- Send a test from the administrator email page.
- Check SPF, DKIM and DMARC.
- Keep the public start response generic; use server logs and audit records for delivery diagnosis.

### The link is invalid

- Links expire after 10 minutes and can be used once.
- Request a new link from `/`.
- Make sure the application base URL matches the deployed HTTPS domain.

### Database migration fails on email

The migration backfills missing legacy emails with unique `@migration.invalid` placeholders before making the column required. Replace every placeholder in the administrator member editor before inviting those users.

## Production checklist

- HTTPS is active.
- Every secret differs between installations.
- Every active user has a unique reachable email.
- Sender SPF and DKIM pass.
- SMTP test succeeds.
- Supabase backups and restore process are verified.
- Legal entity and privacy settings are completed.
- `corepack pnpm check` and `corepack pnpm audit --audit-level high` pass.
