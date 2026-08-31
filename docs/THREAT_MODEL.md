# Threat Model

## Assets

Primary assets are plaintext secrets and their decryption keys. Secondary assets are user sessions and metadata such as secret IDs, ownership and timestamps.

## Trust boundaries

- Browser memory is trusted only for the duration of encryption/decryption.
- Cloudflare Worker and D1 are trusted for availability/authorization, but deliberately not entrusted with plaintext or decryption keys.
- Share links are bearer capabilities: anyone with the complete link can attempt retrieval.

## Primary threats and controls

| Threat | Control |
| --- | --- |
| D1 dump or operator read access | browser-only AES-256-GCM; no key in DB |
| Server request/log compromise | key in URL fragment; no request-body logging |
| Ciphertext modification | AES-GCM authentication failure |
| Guessable secret identifiers | 128-bit random secret IDs |
| Replay/repeated retrieval | atomic consumed-state transition |
| Expired data exposure | expiry predicate on claim + cleanup plan |
| XSS/key exfiltration | strict CSP; no third-party JS on secret pages |
| Brute-force/abuse | Cloudflare rate limiting + Turnstile in deployment phase |
| Session compromise | Better Auth secure HTTP-only SameSite cookies; ownership never grants decrypt key |
| Cross-user metadata enumeration | Owner-filtered queries; identical not-found responses for foreign/missing IDs |
| Claim vs revoke race | Single conditional UPDATE on each side; exactly one winner |
| Auth abuse / enumeration | Generic auth errors; database-backed rate limits; verified-email + reset require configured mail |
| CSRF against revoke | SameSite cookies plus trusted-origin checks on mutating account APIs |

## Account and metadata residual risks

Owner dashboards expose share IDs, timestamps, and status to the signed-in user and to infrastructure. The service cannot recover a lost fragment key. After account deletion, remaining ciphertext rows are unowned; available shares are revoked first so leftover bearer links cannot be claimed. Mail delivery (Resend) sees verification/reset URLs, which are authentication tokens, not secret-share keys. Accounts stay disabled in production until mail, origins, and rate limits are reviewed.
