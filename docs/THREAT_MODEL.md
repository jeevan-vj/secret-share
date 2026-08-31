# Threat Model

## Assets

Primary assets are plaintext secrets and their decryption keys. Secondary assets are user sessions, authentication secrets (password hashes, session tokens, verification/reset tokens), and metadata such as secret IDs, ownership, timestamps, and derived status.

## Trust boundaries

- Browser memory is trusted only for the duration of encryption/decryption.
- Cloudflare Worker and D1 are trusted for availability/authorization, but deliberately not entrusted with plaintext or decryption keys.
- Share links are bearer capabilities: anyone with the complete link can attempt retrieval.
- Optional account sessions are trusted for ownership and revocation only. A session is not a decryption capability.

## Primary threats and controls

| Threat | Control |
| --- | --- |
| D1 dump or operator read access | browser-only AES-256-GCM; no key in DB |
| Server request/log compromise | key in URL fragment; no request-body logging; no auth-token logging |
| Ciphertext modification | AES-GCM authentication failure |
| Guessable secret identifiers | 128-bit random secret IDs |
| Replay/repeated retrieval | atomic consumed-state transition |
| Expired data exposure | expiry predicate on claim + cleanup plan |
| XSS/key exfiltration | strict CSP; no third-party JS on secret pages |
| Brute-force/abuse | Cloudflare rate limiting + Turnstile in deployment phase; Better Auth rate limits on auth endpoints |
| Session compromise | Better Auth secure HTTP-only SameSite cookies; session revoke; ownership never grants decrypt key |
| Forged ownership | server derives `owner_user_id` from session; ignore client ownership claims |
| Session-lookup failure during create | fail closed (do not create an unowned secret) |
| Cross-user metadata enumeration | owner-filtered queries; identical non-disclosing responses for missing/foreign records |
| CSRF against revoke | SameSite cookies + trusted-origin check on owner mutations |
| Claim vs revoke race | single conditional UPDATE for each transition; one winner |
| Auth enumeration | generic sign-up/sign-in/reset responses |
| Token leak via mail logs | mail adapter never logs verification/reset URLs or tokens |

## Residual risks

A compromised sender or recipient browser can read plaintext. Anyone receiving the full share URL has the decryption key. Metadata remains visible to infrastructure. A malicious first viewer can consume a one-time link before the intended recipient. After account deletion, unrevoked bearer links remain claimable until expiry or consume because ownership is unlinked (`ON DELETE SET NULL`) rather than used as a recovery path. These are product properties to communicate clearly, not problems that server-side encryption can solve.
