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
| Database disclosure | Challenge and session HMAC digests; encrypted phone numbers plus an HMAC lookup identifier |
| Session theft | HttpOnly, Secure and SameSite cookies with server-side revocation |
| Reuse of a pairing code | 256-bit secrets, hash-only storage, expiry and single use |
| Accidental two-way sharing | Every pairing code authorises one direction only; the opposite direction needs the other installation's code |
| Forged federation event | Ed25519 signature verification and an explicit trusted-peer list |
| Replay | Timestamp validation, unique nonce and event ID |
| Transitive data spreading | Only records from their home installation may be forwarded |
| SSRF during federation handshake | HTTPS, redirects disabled, IP and DNS validation before production |
| Administrator password disclosure | scrypt with a unique salt; no recoverable password is stored |
| Administrator password guessing | Generic error response, dummy scrypt verification and a five-attempt limit per phone/IP combination for 15 minutes |
| Administrator account takeover | Password login only for active Owner/Admin roles; WebAuthn is recommended as an additional control |

## Production gates

Before storing real member data, use HTTPS, set a unique `SETUP_SECRET`, verify Meta webhook signatures, review retention and backup settings, and consider WebAuthn for Owner/Admin roles.
