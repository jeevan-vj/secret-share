# Threat Model

## Assets

Primary assets are plaintext secrets and their decryption keys. Secondary assets are user sessions, authentication secrets, verification/reset tokens, and metadata such as secret IDs, ownership, timestamps, and derived share status.

## Trust boundaries

- Browser memory is trusted only for the duration of encryption/decryption.
- Cloudflare Worker and D1 are trusted for availability/authorization, but deliberately not entrusted with plaintext or decryption keys.
- Share links are bearer capabilities: anyone with the complete link can attempt retrieval.
- Optional Better Auth sessions authorize management of owned shares only. They do not authorize decryption.
- Google and GitHub are external identity providers when configured. They receive standard OAuth identity/scopes and callback metadata, but no secret contents, ciphertext, share URL, or fragment key.
- The reviewed transactional mail provider (Resend, when configured) sees verification and reset URLs that contain tokens. It never receives secret plaintext or fragment keys.

## Primary threats and controls

| Threat | Control |
| --- | --- |
| D1 dump or operator read access | browser-only AES-256-GCM; no key in DB |
| Server request/log compromise | key in URL fragment; no request-body, token, or full-URL logging |
| Ciphertext modification | AES-GCM authentication failure |
| Guessable secret identifiers | 128-bit random secret IDs |
| Replay/repeated retrieval | atomic consumed-state transition |
| Expired data exposure | expiry predicate on claim + cleanup plan |
| XSS/key exfiltration | strict CSP; no third-party JS on secret pages |
| Brute-force/abuse | Cloudflare rate limiting + Turnstile in deployment phase; Better Auth D1-backed auth rate limits |
| Session compromise | Better Auth HTTP-only SameSite=Lax cookies; ownership never grants decrypt key; revoke-other-sessions |
| Forged ownership | `owner_user_id` taken only from `auth.api.getSession`; unknown create-body fields stripped |
| Silent anonymous downgrade | cookie-present session lookup failures return 503 |
| Cross-user history/revocation | owner-filtered queries; identical not-found responses |
| CSRF against cookie mutations | SameSite=Lax plus trusted-origin checks |
| Account enumeration | verified-email sign-up synthetic success; generic sign-in/reset copy |
| OAuth callback or state tampering | Better Auth state/PKCE validation, fixed local post-login callback, trusted origins, secure SameSite cookies |
| OAuth token disclosure from D1 | Better Auth AES-256-GCM token encryption using the server auth secret; auth logging disabled |
| Social account takeover by unsafe linking | verified-email linking checks; no force-trusted providers; different-email linking disabled |
| Stolen reset/verification token | short-lived DB-backed tokens; tokens never logged; sessions revoked on password reset |
| Claim vs revoke race | mutually exclusive conditional `UPDATE … RETURNING` predicates |
| Account deletion leftovers | revoke available owned shares, then `ON DELETE SET NULL` |

## Residual risks

A compromised sender or recipient browser can read plaintext. Anyone receiving the full share URL has the decryption key. Metadata remains visible to infrastructure. A malicious first viewer can consume a one-time link before the intended recipient. A compromised owner session can revoke available shares or read share IDs and status, but cannot decrypt. A compromised mail provider can receive auth tokens for the targeted inbox. A configured identity provider learns that its user signed in to Secret Share, and a compromise of the Better Auth secret plus D1 could expose stored provider tokens. Database-backed auth rate limits are serialized per D1 writer and are not a substitute for edge WAF limits. Rolling back application code that omits the `revoked_at` claim predicate can make revoked shares claimable again.

These are product properties to communicate clearly, not problems that server-side encryption can solve.
