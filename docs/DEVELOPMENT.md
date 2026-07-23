# Development guide

## Runtime

Use Node.js `24.16.0` and pnpm `10.20.0`.

```bash
corepack enable
nvm use
node --version
pnpm --version
pnpm install
```

The expected versions are declared in `.nvmrc`, `package.json` and the CI workflow. If a login shell resolves an older global Node or pnpm, fix the shell runtime before changing application code.

## Local environment

Copy the example configuration, start PostgreSQL through OrbStack or Docker, apply migrations and seed the local owner:

```bash
cp .env.example .env
docker compose up -d db
pnpm db:migrate
pnpm db:seed
pnpm dev
```

The application is served at `http://localhost:3020`.

SMTP is optional during local UI development. The root sign-in page exposes a development-only administrator button that uses `DEV_ADMIN_EMAIL`, `SEED_OWNER_EMAIL` or the first active administrator. The endpoint is restricted to development mode and loopback hostnames.

## Before starting a change

1. Read `AGENTS.md` and the product invariants.
2. Inspect the current route, service, schema, tests and related documentation.
3. Check `git status` and preserve unrelated user-owned changes.
4. For a multi-module or risky change, copy the structure in `PLANS.md` into the task plan.
5. Prefer the smallest complete change that preserves independent installations and federation compatibility.

## Dependency direction

Keep the architecture boundary simple:

1. a page or client component calls a versioned `/api/v1` route;
2. the route validates external input, establishes identity and calls a service;
3. the service enforces authorization and business invariants;
4. the database layer persists state;
5. security-relevant mutations append an audit event.

Do not put business authorization only in a React component. Hiding a button is user experience, not access control.

## API changes

- Validate external input with Zod at the route boundary.
- Use `assertSameOrigin` for browser mutations.
- Use protocol signatures instead of CSRF checks for federation routes.
- Use `jsonError` for consistent safe responses.
- Keep public error messages free of secrets and internal stack details.
- Use `fetchJson` in client components so empty, malformed and failed responses behave consistently.
- Abort initial client loads when a component unmounts.
- Apply `no-store` to identity, setup and administration responses.

## Database changes

Edit `src/lib/db/schema.ts`, then generate a new migration:

```bash
pnpm db:generate
```

Review the SQL before applying it:

```bash
pnpm db:migrate
```

Commit the schema, migration SQL, snapshot and migration journal together. Never rewrite a migration that may already exist in another independent installation.

For a migration-sensitive feature:

1. test the current database before migration;
2. apply the migration;
3. test the upgraded database;
4. verify the deployed code does not select a new column before the migration has completed;
5. document whether code rollback remains compatible with the migrated schema.

## Authentication and email changes

Preserve these invariants:

- every role signs in through the email magic-link flow on `/`;
- public start responses do not reveal whether an email is registered;
- tokens are random, short-lived, single-use and digest-only at rest;
- the raw token stays in the URL fragment until same-origin confirmation;
- SMTP credentials remain server-side and encrypted;
- the development login remains unavailable in production.

Test registered, unknown, expired, reused and rate-limited cases when the authentication boundary changes.

## Federation changes

Treat a peer as an external security boundary. Preserve:

- exact canonical endpoint and DNS/IP validation;
- Ed25519 request signatures;
- timestamp, nonce, event ID and origin-request idempotency;
- binding between the signing peer and `originInstanceId`;
- one-way permission semantics;
- author-controlled sharing visibility;
- the prohibition on transitively forwarding remote records;
- exclusion of local contact details from federation payloads.

Payload additions should remain optional within protocol v1 so older installations continue to exchange events.

## UI, localization and accessibility

Product copy belongs in the LV/EN/LT/ET dictionaries. The installation-wide language is selected by an administrator; do not reintroduce per-visitor language state.

Installation help, GitHub content, developer documentation, identifiers and code comments stay English.

Verify:

- every route-level header/navigation is composed through `AppHeader`, normally via `AppNavigation`; route files must not introduce their own shell `<nav>` or header CSS;
- mobile-first layout without horizontal page scrolling;
- keyboard access and visible focus;
- accessible names for icon-only controls;
- dialog focus trapping, Escape, fixed headers and focus restoration;
- loading, empty, success, error, disabled and destructive states;
- sufficient text and control contrast;
- locale-sensitive labels and comparisons.

## Vercel deployment workflow

`vercel.json` calls:

```bash
pnpm vercel-build
```

`scripts/vercel-build.mjs` applies migrations when a supported database URL is present and then runs the production build. Without database credentials it skips migrations, emits a clear warning and still builds the setup/help surface.

Do not add production database variables to unrestricted Preview deployments. Use a separate Preview database or leave database credentials unavailable.

## Verification

During implementation, run the smallest relevant test. Before completion, run:

```bash
pnpm check
```

When dependencies change, also run:

```bash
pnpm audit --audit-level high
```

Then exercise affected routes in a browser. For authentication, federation, legal/privacy, setup and migrations, verify the success path and at least one denied or invalid path.

Use `docs/CODE_REVIEW.md` for the final review.

## Pull request and release sequence

1. Update code, tests and English documentation in the same change.
2. Run `pnpm check`.
3. Run the dependency audit when the lockfile changes.
4. Inspect `git diff --check` and generated migrations.
5. Open a pull request using `.github/PULL_REQUEST_TEMPLATE.md`.
6. Merge only after the CI quality job passes.
7. Vercel deploys `main`, applies migrations and builds.
8. Verify `/api/health`, email sign-in and the affected production workflow.
9. Keep the previous deployment available until post-deploy verification is complete.

## Dependency policy

Prefer a dependency only when it removes more risk than it adds. Pin runtime dependencies and review release notes. A forced transitive override requires a build/test check and a short reason in the audit or change description.

Low or moderate toolchain advisories may be accepted only when the vulnerable feature is not used, no compatible patch exists and the decision is recorded. High and critical findings block completion.
