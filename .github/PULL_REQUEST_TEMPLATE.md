## Summary

Describe the user-visible outcome and the reason for the change.

## Risk review

- [ ] Authentication and authorization boundaries were reviewed.
- [ ] Personal data, secrets and logs were reviewed.
- [ ] Federation direction, sharing scope and protocol compatibility were reviewed.
- [ ] Database changes include a forward migration and rollback notes.
- [ ] LV, EN, LT and ET product copy was updated where required.
- [ ] English help and developer documentation was updated where required.

## Verification

- [ ] `pnpm check`
- [ ] `pnpm audit --audit-level high` when dependencies changed
- [ ] Desktop browser flow
- [ ] Mobile browser flow
- [ ] Loading, empty and error states
- [ ] Migration SQL inspected when stored data changed

Add concise evidence, screenshots or deployment notes below.
