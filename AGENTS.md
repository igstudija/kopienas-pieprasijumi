# Repository instructions

## Product invariants

- This is a self-hosted, independent installation. Do not introduce a central SaaS database, shared authentication service, or dependency on the template owner.
- Every active user authenticates through the same email magic-link flow on `/`. After authentication the request list replaces the login view at the same `/` route. Administrator-only pages are exposed only through the authenticated navigation; there is no separate administrator login method or legacy application route.
- Federation is direct and one-way per accepted code. Never relay data received from one peer to another peer.
- A request leaves its home installation only when its author explicitly selects a sharing scope.
- Product UI supports `lv`, `en`, `lt`, and `et`. Installation help, developer documentation, identifiers, and code comments are English.

## Repository map

- `src/app`: Next.js pages and API route adapters.
- `src/components`: client UI; keep data access behind versioned API routes.
- `src/lib/services`: business rules, authorization, audit events, and federation workflows.
- `src/lib/db`: Drizzle client and schema.
- `migrations`: generated, append-only Drizzle migrations.
- `tests`: Vitest tests for pure rules, protocol boundaries, and regressions.
- `docs`: installation, development, threat model, review rules, and audit notes.

## Runtime and commands

- Use Node `24.16.0` from `.nvmrc`, pnpm `10.20.0`, and Corepack. Do not use npm or yarn in this repository.
- Before diagnosing a tool failure, run `node --version` and `pnpm --version`; a login shell may resolve an older global runtime.
- Install with `pnpm install --frozen-lockfile` in CI and `pnpm install` locally.
- The required completion gate is `pnpm check` (lint, TypeScript, tests, production build).
- Run `pnpm audit --audit-level high` when dependencies change.
- Vercel runs `pnpm vercel-build`; it migrates when a supported database URL is available and otherwise builds only the setup/help surface.

## Change rules

- Make the smallest complete change that preserves existing behavior. Inspect adjacent code, schema, migrations, tests, and documentation first.
- Keep route handlers thin: validate input with Zod, authenticate/authorize, call a service, and normalize errors.
- State-changing browser routes must call `assertSameOrigin`. Webhooks and federation routes must use their protocol signatures instead.
- Never expose database credentials, encryption keys, SMTP credentials, magic-link tokens, pairing secrets, full phone numbers, or session tokens to the client or logs.
- Do not trust an endpoint embedded in a federation code until HTTPS, canonical path, DNS, and resolved IP checks pass. Do not follow redirects.
- Bind every signed federation event to the authenticated peer identity and preserve replay/idempotency checks.
- Use `fetchJson` for browser API calls. Abort load requests on unmount and show a user-visible failure state.
- Interactive controls need accessible names, keyboard operation, visible focus, sufficient contrast, and mobile-first layouts without horizontal page scrolling.
- Reuse shared headers, drawers, API helpers, dialog behavior, icons, and translation dictionaries instead of copying them.
- Do not add explanatory comments for obvious code. Comments that are necessary must explain the invariant or reason in English.

## Database and compatibility

- Change `src/lib/db/schema.ts`, then run `pnpm db:generate`. Inspect the SQL and commit the schema, migration, snapshot, and journal together.
- Never edit or delete an already released migration. Add a forward migration.
- Do not expose the Production database to unrestricted Preview deployments; use a separate Preview database or omit Preview database credentials.
- Federation payload changes must remain backward compatible within protocol v1 unless a versioned protocol migration is designed.
- Preserve encrypted-at-rest phone data and HMAC lookup identifiers; never add a plaintext phone column.

## Definition of done

1. The relevant failure or requirement is understood and covered by a test where practical.
2. Authorization, privacy, federation direction, migration, and backward-compatibility effects are reviewed.
3. `pnpm check` passes on Node 24 and pnpm 10.
4. Dependency changes pass `pnpm audit --audit-level high`.
5. Affected desktop and mobile browser flows are exercised, including loading, empty, error, keyboard, and modal states.
6. English developer/help documentation and all four UI locales are updated when behavior or copy changes.

For large or risky work, write a short execution plan using `PLANS.md`. Use `docs/CODE_REVIEW.md` before requesting review and `docs/DEVELOPMENT.md` for the full workflow.
