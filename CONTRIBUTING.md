# Contributing

Thank you for improving Specific Requests.

## Before contributing

Read:

- `docs/CONVENTIONS.md` for product invariants and completion rules;
- `ARCHITECTURE.md` for trust boundaries;
- `docs/DEVELOPMENT.md` for the implementation workflow;
- `docs/CODE_REVIEW.md` for the review checklist;
- `SECURITY.md` before reporting a vulnerability.

The project is self-hosted and noncommercial under the repository licence. A contribution must not introduce a central SaaS dependency, shared authentication service or hidden data transfer to the template owner.

## Development

Use Node.js `24.16.0`, pnpm `10.20.0` and Corepack.

```bash
cp .env.example .env
docker compose up -d db
corepack pnpm install
corepack pnpm db:migrate
corepack pnpm db:seed
corepack pnpm dev
```

## Change expectations

- Keep route handlers thin and business rules in services.
- Add or update tests for behavior changes.
- Generate a new forward-only migration for schema changes.
- Preserve federation protocol v1 compatibility unless a versioned migration is designed.
- Keep product UI copy in LV, EN, LT and ET.
- Keep help, GitHub content, identifiers and comments in English.
- Do not commit secrets, personal data, `.env` files or production exports.

## Before opening a pull request

```bash
corepack pnpm check
corepack pnpm audit --audit-level high
```

Use the pull request template and include browser evidence for affected desktop and mobile flows.
