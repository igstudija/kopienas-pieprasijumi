# Security policy

## Reporting a vulnerability

Do not open a public GitHub issue for a vulnerability that could expose member data, credentials, session tokens, email links, federation keys or connected installations.

Send a private report to the repository owner through the contact method listed on [codars.com](https://codars.com). Include:

- the affected commit or version;
- the route, component or protocol involved;
- reproduction steps;
- the expected and observed result;
- the potential data or installation impact;
- any suggested mitigation.

Do not include real member data or production secrets. Use a local test installation.

## Supported version

Security fixes are applied to the latest commit on `main`. Independent operators are responsible for pulling updates, reviewing migrations, deploying them and verifying their own backups.

## Operator responsibilities

Before storing real member data:

- use HTTPS;
- keep Vercel, Supabase, GitHub and email-provider accounts protected with multi-factor authentication;
- use unique installation secrets and dedicated SMTP keys;
- separate Production and Preview databases;
- verify SPF, DKIM and preferably DMARC;
- configure legal, privacy and retention settings;
- enable backups and test a restore;
- keep dependencies and the deployed `main` revision current.

The detailed trust model is in `docs/THREAT_MODEL.md`.
