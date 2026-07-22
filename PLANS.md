# Execution plan template

Use this file as a template for work that spans modules, changes stored data, alters authentication/federation, or cannot be safely completed in one small patch.

## Goal

State the observable outcome and who benefits.

## Current behavior and evidence

Record the relevant routes, services, schema, logs, screenshots, or failing tests.

## Constraints and invariants

List security, privacy, self-hosting, compatibility, localization, and migration constraints.

## Plan

1. Describe an independently verifiable step.
2. Identify files or boundaries affected by that step.
3. Include rollback or compatibility work where relevant.

Keep exactly one step marked in progress while implementing. Update the plan when evidence changes the approach.

## Verification

- automated checks and regression tests;
- migration inspection or test migration;
- desktop and mobile browser flows;
- security and privacy checks;
- documentation and localization review.

## Result

Summarize what changed, what was verified, and any explicit follow-up risk. Do not mark the plan complete while required work remains.
