# Security Policy and Engineering Invariants

## Non-negotiable invariants

1. Plaintext secret content MUST NEVER reach the server.
2. Secret decryption keys MUST NEVER be persisted or logged server-side.
3. Secret keys MUST be generated with Web Crypto secure randomness.
4. Secret encryption MUST use authenticated encryption (AES-256-GCM in V1).
5. Decryption keys MUST be carried only in URL fragments.
6. Server logs MUST NOT include secret request bodies, ciphertext bodies, full share URLs, auth tokens, passwords, verification/reset tokens, keys, or sensitive headers.
7. Expired, consumed, or revoked secrets MUST NOT be retrievable.
8. One-time claim MUST be atomic.
9. All API inputs MUST be validated server-side.
10. Third-party scripts are prohibited on secret create/reveal pages unless explicitly security-reviewed.
11. Authenticated ownership MUST NOT imply decryptability.
12. Do not add a "recovery" mechanism that gives the server access to secret keys.
13. `owner_user_id` MUST be derived from a server-validated session, never from a client claim.
14. Session lookup infrastructure failures MUST NOT silently create an unowned secret.
15. Owner APIs MUST return an allowlist of metadata only and MUST NOT enumerate another user's records.
16. Cookie-authenticated mutations MUST be origin-checked against trusted origins.

## Optional accounts

Accounts are optional. Anonymous sharing remains supported. Signing in never reconstructs `/s/<id>#k=<key>` because the fragment key never reaches the server.

Production account features remain disabled until `ACCOUNTS_ENABLED=true`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `AUTH_EMAIL_FROM`, and `RESEND_API_KEY` are configured. Email verification and password reset MUST be available before production enablement. The Resend HTTP API is the checked-in mailer; it is still a deployment-time review item.

Google and GitHub social sign-in are optional and enabled only by complete provider credential pairs. OAuth callbacks terminate at Better Auth under `/api/auth/callback/<provider>`. Provider tokens are encrypted at rest with the Better Auth secret. Providers are not force-trusted for account linking, different-email linking is disabled, and no provider SDK or script may be added to secret creation/reveal pages. Identity providers receive the normal OAuth identity request and callback metadata, but MUST never receive secret plaintext, ciphertext, share URLs, or fragment keys.

## Reporting

Do not open public issues containing live secrets, credentials, exploit payloads against production, or customer data. Use GitHub private vulnerability reporting when enabled, or contact the repository owner privately.

## Review checklist

Security-sensitive PRs must answer: Does plaintext ever cross a network boundary? Can a new code path expose the URL fragment? Can logs capture secret material? Does a schema change persist key material? Can concurrent requests defeat one-time semantics? Does new client-side script expand the XSS supply-chain surface? Can OAuth state, callbacks, token storage, or account linking enable redirect abuse or account takeover? Can a client forge ownership? Can an owner dashboard return ciphertext or a full share URL? Does a claim/revoke race return ciphertext more than once?
