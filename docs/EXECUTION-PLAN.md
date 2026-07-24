# Execution plan template

Use this structure for work that spans modules, changes stored data, alters authentication or federation, changes deployment behavior, or cannot be completed safely as one small patch.

## Goal

State the concrete user-visible outcome. Avoid implementation language unless the implementation itself is the requirement.

## Current behavior and evidence

Record:

- the current route, component, service and schema involved;
- the observed failure or limitation;
- relevant logs, screenshots, tests or database state;
- existing user-owned changes that must be preserved.

## Scope

List what this change includes and explicitly excludes. A later request to finish quickly does not expand authorization beyond this scope.

## Constraints and invariants

Review the applicable items:

- independent self-hosted installation;
- one email magic-link flow on `/`;
- no secret or personal-data exposure;
- author-controlled request sharing;
- one-way federation permissions;
- no transitive forwarding;
- forward-only database migrations;
- protocol v1 compatibility;
- LV, EN, LT and ET product UI;
- English help, GitHub documentation, identifiers and comments;
- mobile-first and accessible interaction.

## Plan

Keep one step in progress:

1. inspect the current implementation and confirm the requirement;
2. implement the smallest complete change;
3. add or update tests and migrations;
4. update documentation and localization;
5. run automated and browser verification;
6. review the final diff, commit and deploy.

Update the plan when evidence changes the approach.

## Data and security review

Document:

- affected personal data and secrets;
- authorization and CSRF/protocol checks;
- migration and rollback compatibility;
- federation payload or trust-boundary changes;
- logging, rate-limit and retention effects.

## Verification

Include the relevant evidence:

- focused regression tests;
- `pnpm check`;
- `pnpm audit --audit-level high` after dependency changes;
- migration SQL inspection and local application;
- desktop and mobile browser flows;
- loading, empty, error, denied and destructive states;
- production health and post-deploy checks.

## Result

After completion, record:

- the implemented behavior;
- tests and browser checks performed;
- migration and deployment status;
- known limitations or follow-up work;
- commit and deployment references.
