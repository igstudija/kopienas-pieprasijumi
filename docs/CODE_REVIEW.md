# Code review rules

Review consequential behavior first. Formatting and deterministic style checks belong to CI.

## Security and privacy

- Is every server mutation authenticated, authorized, validated, and protected against CSRF or its protocol equivalent?
- Can an error, log, response, client bundle, or audit record expose a secret or full phone number?
- Are setup secrets, sessions, login challenges, pairing secrets and encrypted values stored using the established primitives?
- Can a URL, redirect, DNS response, or federation identity bypass SSRF or peer-origin controls?
- Are replay, idempotency, expiry, and rate limits preserved?

## Data and federation

- Does a schema change include a forward migration and remain safe for existing installations?
- Does the deployment workflow apply the migration before code selects the new schema?
- Does deletion preserve the intended audit/privacy contract?
- Can a remote record be mistaken for a local record or be forwarded transitively?
- Is one-way sharing still explicit, and can an author control request visibility?
- Is a protocol v1 payload change backward compatible?

## Correctness and maintainability

- Is business logic in a service rather than duplicated across routes or components?
- Are external inputs parsed once at the boundary and internal types narrow enough to prevent invalid states?
- Are async failures, cancellation, retries, and partial success handled intentionally?
- Is shared behavior reused instead of copied?
- Does the change avoid unbounded queries, repeated connections, accidental sequential work, and unnecessary client JavaScript?

## User experience and accessibility

- Does the feature work mobile-first without horizontal page scrolling?
- Can every action be completed with a keyboard and screen reader labels?
- Do dialogs manage focus, Escape, background scrolling, errors, and return focus?
- Are loading, empty, success, error, disabled, and destructive states understandable?
- Are all LV/EN/LT/ET strings and locale-sensitive comparisons updated?
- Are installation help, GitHub content and developer documentation still accurate and in English?

## Evidence required

- Relevant regression tests or a short reason a test is impractical.
- `pnpm check` output.
- `pnpm audit --audit-level high` after dependency changes.
- Browser verification of affected desktop and mobile flows.
- Migration SQL inspection when stored data changes.
- Deployment and post-deploy verification when build or environment behavior changes.
