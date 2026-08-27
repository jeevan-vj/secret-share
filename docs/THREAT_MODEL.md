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
| Session compromise | Better Auth secure sessions; ownership never grants decrypt key |

## Residual risks

A compromised sender or recipient browser can read plaintext. Anyone receiving the full share URL has the decryption key. Metadata remains visible to infrastructure. A malicious first viewer can consume a one-time link before the intended recipient. These are product properties to communicate clearly, not problems that server-side encryption can solve.
