# Execution plan template

Use this file as a template for work that spans modules, changes stored data, alters authentication/federation, or cannot be safely completed in one small patch.

## Goal

Use one email magic-link flow on `/` for every role, while keeping each installation self-hosted and easy to configure with Brevo, Mailjet, or custom SMTP.

## Current behavior and evidence

The root route is both the public sign-in view and the authenticated request list. Administrators use the same authentication flow and receive additional navigation links according to their role.

## Constraints and invariants

- SMTP credentials stay encrypted in the installation database.
- Login tokens are random, short-lived, single-use, hashed at rest, and never placed in server-visible query strings.
- `/` is the only login form and the authenticated request list. Authentication does not redirect to an application route.
- Existing installations remain recoverable through a forward-only migration and existing users without email remain editable by an administrator.
- Product UI remains localized in `lv`, `en`, `lt`, and `et`; installation and developer documentation remain English.

## Plan

1. Add encrypted SMTP settings, email challenges, delivery, rate limiting, and session confirmation.
2. Replace the login, setup, administrator settings, and user-management UI.
3. Remove obsolete authentication routes and update legal, installation, architecture, and threat-model documentation.
4. Generate and inspect the forward migration, then run tests, lint, typecheck, production build, dependency audit, and browser checks.

Keep exactly one step marked in progress while implementing. Update the plan when evidence changes the approach.

## Verification

- automated checks and regression tests;
- migration inspection or test migration;
- desktop and mobile browser flows;
- security and privacy checks;
- documentation and localization review.

## Result

Completed. The forward migration was applied locally, the complete quality gate passed, the dependency audit has no high-severity findings, and browser checks confirmed that `/` is the authenticated request list while the removed legacy application route returns 404 without redirecting.
