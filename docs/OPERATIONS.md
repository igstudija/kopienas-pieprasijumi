# Operations and upgrade guide

## Ownership model

Each installation has its own:

- GitHub repository;
- Vercel project and deployment history;
- Supabase or PostgreSQL database;
- SMTP provider account;
- member and administrator accounts;
- federation identity and peer list.

The template owner cannot recover operator secrets or administer an installation unless the operator explicitly grants access.

## Routine production release

1. Confirm that CI passes on the commit to be released.
2. Review generated migration SQL and create a current database backup.
3. Merge to `main`.
4. Vercel runs `pnpm vercel-build`.
5. The build applies pending migrations when production database credentials exist.
6. The build creates the new Next.js deployment.
7. Verify `/api/health`.
8. Sign in through a fresh email magic link.
9. Verify the request list and the administration route affected by the release.
10. Keep the previous Vercel deployment available until verification is complete.

## Migration safety

Migrations are append-only. Never edit a migration that may already have run on another installation.

Before a release:

- identify every new table, column, index and constraint;
- assess lock duration and table size;
- backfill before enforcing a new required constraint when necessary;
- preserve compatibility with the previous application version where practical;
- document when application rollback is unsafe after migration.

If a deployment reports a missing column, do not retry the application blindly. Confirm the target database, apply the pending migration and then reload.

## Backups and restore drills

The operator is responsible for database backups.

At minimum:

1. enable the backup option appropriate to the selected Supabase plan;
2. record how to obtain a logical export;
3. store recovery credentials separately from daily operator accounts;
4. restore into a separate project;
5. connect a temporary deployment to the restored database;
6. verify members, requests, settings and audit data;
7. record the date and result of the drill.

Never test a destructive restore over the live production database.

## Application rollback

Vercel can promote or redeploy an earlier application revision. This rolls back code, not the database.

Before rolling back:

- check whether the newer release applied a migration;
- confirm that the older code can read the migrated schema;
- prefer a forward fix when the migration is not backward compatible;
- preserve logs and the failing deployment ID for investigation.

## SMTP operations

- Use a dedicated SMTP key.
- Protect the provider account with multi-factor authentication.
- Keep sender SPF and DKIM valid.
- Run a real test after changing provider, key, sender or domain.
- Revoke the old key after successful rotation.
- Use the environment fallback only for bootstrap or recovery; save the final settings through the administration page.

## Secret rotation

Safe routine rotations:

- `SETUP_SECRET` after installation, because it is not copied into the database;
- SMTP keys, by replacing and testing them in the administration page;
- database passwords, by resynchronizing the Vercel integration and redeploying.

Do not rotate `DATA_ENCRYPTION_KEY`, `INSTANCE_MASTER_KEY` or a root secret used to derive encryption material without a dedicated data re-encryption migration. Existing encrypted phone numbers, SMTP credentials and federation keys depend on that material.

## Federation operations

- Treat each peer as an external system.
- Confirm the domain embedded in a received code.
- Exchange both codes only when two-way sharing is intended.
- Deactivate a peer immediately when trust is withdrawn.
- Preserve delivery and signature logs during an incident.
- Never copy a federation private key to another installation.

## Incident checklist

1. Contain access by deactivating affected users or peers.
2. Revoke exposed SMTP, database or platform credentials.
3. Preserve Vercel, Supabase, SMTP and audit evidence.
4. Determine which member and request data was accessible.
5. Restore service with forward fixes and verified credentials.
6. Follow the operator's legal notification obligations.
7. Document root cause, timeline and prevention actions.

## Scheduled maintenance

Monthly:

- review Dependabot pull requests;
- run the high-severity dependency audit;
- review active administrators and peers;
- send an SMTP test;
- confirm the latest successful backup.

Quarterly:

- review legal and privacy settings;
- review retention and processor agreements;
- test owner account recovery;
- verify the restore procedure;
- review Vercel Production and Preview environment separation.
