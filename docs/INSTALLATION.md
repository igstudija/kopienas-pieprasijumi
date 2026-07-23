# Installation guide

This application is not a central SaaS service. Every community runs an independent GitHub repository, Vercel project, PostgreSQL database and SMTP account.

## What you need

- a GitHub account;
- a Vercel account;
- a Supabase account or another PostgreSQL database;
- a Brevo, Mailjet or custom SMTP account;
- a verified sender email or domain;
- a unique `SETUP_SECRET` with at least 12 characters.

Use a password manager to generate and store the installation secret. Create a dedicated SMTP key instead of using the password of a normal email account.

## Recommended Vercel and Supabase flow

### 1. Deploy the application

1. Open the **Deploy with Vercel** button in the repository README.
2. Sign in to Vercel.
3. Choose the GitHub account or organization that will own the copied repository.
4. Enter a unique value for `SETUP_SECRET`.
5. Create the Vercel project and wait for the first deployment.

The first deployment is allowed to finish without database credentials. It provides a working setup page with a clear database status instead of failing with a generic build error.

### 2. Connect Supabase

1. Open the new Vercel project.
2. Open **Storage** or **Integrations** and choose **Supabase**.
3. Create a Supabase project or connect an existing project owned by this community.
4. Connect the Supabase resource to the Vercel project.
5. Open **Project Settings → Environment Variables**.
6. Confirm that at least one supported pooled database variable exists:
   - `POSTGRES_URL`;
   - `DATABASE_URL`;
   - `POSTGRES_PRISMA_URL`.
7. Redeploy the application.

On the second deployment, `pnpm vercel-build` detects the database credential, applies all committed Drizzle migrations and then runs the Next.js production build.

The official Supabase Marketplace integration also synchronizes Supabase project variables such as `POSTGRES_URL`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_SECRET_KEY`. This application uses the PostgreSQL connection directly; it does not use Supabase Auth for member login.

### 3. Complete `/setup`

Open the production URL. An unconfigured database redirects to `/setup`.

The wizard asks for:

1. community name, time zone and installation-wide language;
2. email provider and SMTP credentials;
3. verified sender email and sender name;
4. owner name, company, sign-in email and contact phone;
5. the same `SETUP_SECRET` entered in Vercel.

Before any installation data is saved, the wizard opens an SMTP connection and sends a real test email to the owner address. After success, open `/`, enter the owner email and use the one-time sign-in link.

## Existing Supabase project

The recommended method is to connect the existing project through the Vercel Supabase integration. This keeps the database variables synchronized with the Vercel project.

For a manual connection:

1. copy the pooled PostgreSQL connection string from Supabase;
2. add it to Vercel as `DATABASE_URL`, `POSTGRES_URL` or `POSTGRES_PRISMA_URL`;
3. scope the variable to Production;
4. redeploy.

Do not expose a database URL through a variable beginning with `NEXT_PUBLIC_`.

## Production, Preview and Development environments

Vercel separates Production, Preview and Development environment variables.

- **Production** should use the live community database.
- **Preview** should use a separate disposable or dedicated preview database.
- **Development** is for local Vercel CLI use.

Do not point arbitrary pull-request previews at the production database. A preview build with production credentials can apply migrations and execute server code against live data.

If you do not maintain a separate preview database, leave database credentials unavailable to Preview deployments. The deployment will build, but data-dependent pages will show the setup/database status rather than accessing production data.

## SMTP provider values

### Brevo

- Provider: `Brevo`
- Host: `smtp-relay.brevo.com`
- Port: `587`
- Direct TLS/SSL: disabled
- Username: the SMTP login shown in Brevo
- Password: a generated SMTP key

Verify the sender or domain in Brevo before running the wizard.

### Mailjet

- Provider: `Mailjet`
- Host: `in-v3.mailjet.com`
- Port: `587`
- Direct TLS/SSL: disabled
- Username: API Key
- Password: Secret Key

Verify the sender or domain in Mailjet before running the wizard.

### Custom SMTP

Use the values supplied by the provider:

- port `587` normally uses STARTTLS and leaves **Direct TLS/SSL** disabled;
- port `465` normally uses implicit TLS and enables **Direct TLS/SSL**.

The sender address must be permitted by the SMTP account.

## Where secrets and personal data are stored

| Value | Storage |
| --- | --- |
| Database credentials | Vercel Environment Variables |
| `SETUP_SECRET` | Vercel Environment Variables |
| SMTP username and password | AES-GCM encrypted in the installation database |
| Federation private key | AES-GCM encrypted in the installation database |
| Member phone | AES-GCM encrypted in the installation database |
| Member website and email | installation database |
| Magic-link token | only an HMAC digest in the database |
| Session token | only an HMAC digest in the database and an HttpOnly cookie in the browser |

The administration API reports whether SMTP credentials exist but never returns their stored values.

## Optional SMTP environment fallback

An existing installation can configure email delivery before an administrator can sign in:

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

Values saved through **Administration → Email and authentication** take precedence over environment fallback values.

## Local installation with OrbStack or Docker

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

Open `http://localhost:3020`.

The seed creates or updates the owner identified by `SEED_OWNER_EMAIL`. In local development, the root sign-in page includes **Sign in as local administrator**:

- it uses `DEV_ADMIN_EMAIL` when configured;
- otherwise it uses `SEED_OWNER_EMAIL`;
- otherwise it selects the first active owner or administrator.

The development endpoint requires both `NODE_ENV=development` and a loopback hostname. It returns `404` in production and cannot replace SMTP sign-in in a deployed installation.

## Non-Vercel deployment

The application can run anywhere that provides:

- Node.js 24;
- a persistent PostgreSQL database;
- HTTPS;
- the variables in `.env.example`;
- a process that runs migrations before the new application version starts.

Minimum release sequence:

```bash
corepack pnpm install --frozen-lockfile
corepack pnpm db:migrate
corepack pnpm build
corepack pnpm start
```

For the provided Docker image, run migrations separately before starting the new container:

```bash
docker compose --profile tools run --rm migrate
docker compose up -d --build app
```

## Upgrading an existing installation

1. Create or verify a current database backup.
2. Read the incoming migration SQL.
3. Deploy the new `main` commit.
4. Vercel runs forward-only migrations before the production build.
5. Open `/api/health`.
6. Verify email sign-in, the request list and affected administrator pages.
7. Keep the previous Vercel deployment available for an application rollback.

Do not rewrite, delete or reorder released migration files. A code rollback does not automatically reverse a database migration. See [OPERATIONS.md](./OPERATIONS.md).

## Troubleshooting

### Vercel deployment shows the setup page without a database

The first build intentionally succeeds without database variables.

1. connect Supabase to the same Vercel project;
2. verify `POSTGRES_URL`, `DATABASE_URL` or `POSTGRES_PRISMA_URL`;
3. confirm that the variable is available to the intended environment;
4. redeploy.

### Database migration fails

- Confirm that the connection string is the pooled PostgreSQL URL.
- Check that the Supabase project is active and the password has not been rotated without resynchronizing Vercel.
- Inspect the first failing migration in the Vercel build log.
- Do not manually mark a failed migration as complete.
- Restore from backup only when recovery has been planned and verified.

### The application reports a missing column

The code was deployed without applying its matching migration.

1. verify the production database variable;
2. run `corepack pnpm db:migrate` against the correct database or redeploy through Vercel;
3. reload only after the migration succeeds.

### Email is not received

- Check Spam or Junk.
- Verify the sender or domain at the provider.
- Confirm that the SMTP username and dedicated key are correct.
- Send a test from **Administration → Email and authentication**.
- Check SPF, DKIM and preferably DMARC.
- Keep the public sign-in response generic; use server logs and audit records for diagnosis.

### The sign-in link is invalid

- Links expire after 10 minutes and can be used once.
- Request a new link from `/`.
- Confirm that the installation base URL matches the production HTTPS domain.
- Do not copy only part of the URL fragment.

## Production checklist

- HTTPS and the final production domain are active.
- Supabase Production variables point to the intended production project.
- Preview deployments do not use production database credentials.
- `SETUP_SECRET` is unique and stored in a password manager.
- Every active member has a unique reachable email.
- Sender SPF and DKIM pass.
- A real SMTP test succeeds.
- Supabase backups are enabled and a restore procedure has been tested.
- Legal entity, privacy contact and retention settings are complete.
- Owner email accounts use multi-factor authentication.
- `corepack pnpm check` passes.
- `corepack pnpm audit --audit-level high` passes.
