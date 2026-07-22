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

The expected versions are also declared in `.nvmrc`, `package.json`, and the CI workflow. If a command reports that Node 20 is active, fix the shell runtime before changing application code.

## Local environment

Copy `.env.example` to `.env`, start PostgreSQL through Docker or OrbStack, apply migrations, and seed the local owner:

```bash
docker compose up -d db
pnpm db:migrate
pnpm db:seed
pnpm dev
```

The application is served at `http://localhost:3020`.

## Architecture workflow

Keep the dependency direction simple:

1. page or client component calls a versioned `/api/v1` route;
2. the route validates input, establishes identity and calls a service;
3. the service enforces authorization and business invariants;
4. the database layer persists state;
5. security-relevant mutations append an audit event.

Do not put business authorization only in a React component. Hiding a button is user experience, not access control.

## API changes

- Validate external input with Zod at the route boundary.
- Use `assertSameOrigin` for browser mutations.
- Use `jsonError` for consistent safe responses.
- Keep public error messages free of secrets and internal stack details.
- Use `fetchJson` in client components so empty, malformed, and failed responses behave consistently.
- Abort initial client loads when a component unmounts.

## Database changes

Edit `src/lib/db/schema.ts`, then generate a new migration:

```bash
pnpm db:generate
```

Review the generated SQL. Never rewrite a migration that may already exist in another independent installation. Apply the migration locally with `pnpm db:migrate` and include the schema, SQL, snapshot, and journal in the same change.

## Federation changes

Treat a peer as an external security boundary. Preserve:

- exact canonical endpoint and DNS/IP validation;
- Ed25519 request signatures;
- timestamp, nonce, event ID, and origin request idempotency;
- binding between the signing peer and `originInstanceId`;
- one-way permission semantics;
- the prohibition on transitively forwarding remote records.

Payload additions should be optional within protocol v1 so older installations continue to exchange events.

## Localization and accessibility

Product copy belongs in the existing LV/EN/LT/ET dictionaries. Do not hard-code Latvian fallback text in a multilingual component when a translation key is appropriate. Installation help and developer documentation stay English.

Check keyboard access, focus restoration, control labels, error announcements, contrast, reduced mobile width, and page overflow. Shared dialogs and drawers must lock background scrolling and keep focus within the active surface.

## Verification

During implementation, run the smallest relevant checks. Before completion, run:

```bash
pnpm check
pnpm audit --audit-level high
```

Then exercise the affected routes in a browser. For authentication, federation, legal/privacy, and migrations, verify both the success path and at least one denied or invalid path.

## Dependency policy

Prefer a dependency only when it removes more risk than it adds. Pin runtime dependencies and review their release notes. A forced transitive override requires a build/test check and a short reason in the audit or change description.

Low or moderate toolchain advisories may be accepted only when the vulnerable feature is not used, no compatible patch exists, and the decision is recorded. High and critical findings block completion.
