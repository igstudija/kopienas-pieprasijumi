# Threat model

## Protected assets

- member phone numbers and profiles;
- local and shared request content;
- WhatsApp API credentials;
- session and one-time WhatsApp challenge secrets;
- administrator password hashes;
- the federation private key;
- audit evidence.

## Main threats and controls

| Threat | Control |
| --- | --- |
| Enumeration of registered phone numbers | The same public response is returned for registered and unknown numbers |
| Guessing or replaying a login link | High-entropy token, two-minute TTL, HMAC digest and single use; the sender must match an active registered number |
| QR challenge resource abuse | Per-IP creation limit with a bounded fallback when no address is available, short expiry, indexed lookup and retention cleanup; clients do not automatically retry rate-limit responses |
| Database disclosure | Challenge and session HMAC digests; encrypted phone numbers plus an HMAC lookup identifier |
| Session theft | HttpOnly, Secure and SameSite cookies with server-side revocation |
| Reuse of a pairing code | 256-bit secrets, hash-only storage, expiry and single use |
| Accidental two-way sharing | Every pairing code authorises one direction only; the opposite direction needs the other installation's code |
| Forged federation event | Ed25519 signature verification, an explicit trusted-peer list and equality between the signing peer and claimed origin instance |
| Replay | Timestamp validation, unique nonce and event ID; expired nonce rows are removed outside the validation window |
| Transitive data spreading | Only records from their home installation may be forwarded |
| SSRF during federation handshake | Exact endpoint, production HTTPS, redirects disabled, and DNS/resolved-IP rejection of local, private, link-local, reserved, documentation and multicast networks |
| Administrator password disclosure | scrypt with a unique salt; no recoverable password is stored |
| Administrator password guessing | Generic error response, dummy scrypt verification and a five-attempt limit per phone/IP combination for 15 minutes |
| Administrator account takeover | Password login only for active Owner/Admin roles; WebAuthn is recommended as an additional control |

## Production gates

Before storing real member data, use HTTPS, set a unique `SETUP_SECRET`, use a stable `INSTANCE_MASTER_KEY`, verify Meta webhook signatures, review retention and backup settings, run a restore drill, and consider WebAuthn for Owner/Admin roles.
