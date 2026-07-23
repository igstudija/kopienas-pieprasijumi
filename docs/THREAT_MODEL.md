# Threat model

## Protected assets

- member email addresses, encrypted phone numbers and profiles;
- local and shared request content;
- encrypted SMTP credentials;
- session and one-time email-link secrets;
- installation and deployment secrets;
- the federation private key;
- audit evidence.

## Main threats and controls

| Threat | Control |
| --- | --- |
| Enumeration of registered emails | The public start endpoint returns the same success response for registered and unknown addresses |
| Guessing or replaying a sign-in link | 256-bit random token, 10-minute TTL, HMAC digest-only storage and single use |
| Email challenge resource abuse | Per-IP and per-address limits, indexed lookup and retention cleanup |
| Link leakage in logs or referrers | The raw token is placed in the URL fragment, which is not sent to the server; confirmation uses a same-origin POST |
| Database disclosure | Challenge and session HMAC digests; AES-GCM encrypted SMTP credentials and phone numbers |
| SMTP credential disclosure | Credentials are accepted only server-side, encrypted before database storage and never returned to the browser |
| Session theft | HttpOnly, Secure and SameSite cookies with server-side revocation |
| Preview deployment changes production data | Production and Preview database credentials are separated; operators are instructed not to expose the production database to unrestricted previews |
| Code deploys before its schema migration | The Vercel production build applies committed migrations before the Next.js build when database credentials are present |
| Reuse of a pairing code | 256-bit secrets, digest-only storage, expiry and single use |
| Accidental two-way sharing | Every pairing code authorises one direction; the opposite direction needs the other installation's code |
| Forged federation event | Ed25519 signature verification, explicit trusted peers and origin equality |
| Replay | Timestamp validation, unique nonce and event ID |
| Transitive data spreading | Only records from their home installation may be forwarded |
| SSRF during federation handshake | Exact endpoint, production HTTPS, redirects disabled and DNS/resolved-IP rejection of non-public networks |

Email delivery itself depends on the operator's chosen provider. The operator must protect that account with multi-factor authentication, use a dedicated SMTP key, verify sender DNS records and maintain the applicable data-processing agreement.

## Production gates

Before storing real member data:

1. use HTTPS and unique `SETUP_SECRET`, `APP_SECRET`, `PHONE_LOOKUP_SECRET` and encryption key material;
2. verify SPF, DKIM and preferably DMARC for the sender domain;
3. send a real SMTP test from the administration page;
4. review retention, processor and privacy settings;
5. verify backups and run a restore drill;
6. keep owner email accounts protected with multi-factor authentication;
7. keep Preview deployments isolated from the Production database.
