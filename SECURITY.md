# Security Policy and Engineering Invariants

## Non-negotiable invariants

1. Plaintext secret content MUST NEVER reach the server.
2. Secret decryption keys MUST NEVER be persisted or logged server-side.
3. Secret keys MUST be generated with Web Crypto secure randomness.
4. Secret encryption MUST use authenticated encryption (AES-256-GCM in V1).
5. Decryption keys MUST be carried only in URL fragments.
6. Server logs MUST NOT include secret request bodies, ciphertext bodies, full share URLs, auth tokens or keys.
7. Expired, consumed, or revoked secrets MUST NOT be retrievable.
8. One-time claim MUST be atomic.
9. All API inputs MUST be validated server-side.
10. Third-party scripts are prohibited on secret create/reveal pages unless explicitly security-reviewed.
11. Authenticated ownership MUST NOT imply decryptability.
12. Do not add a "recovery" mechanism that gives the server access to secret keys.
13. `owner_user_id` MUST be derived from a server-validated session, never from a client claim.
14. Session/auth infrastructure failures MUST NOT silently downgrade an intended owned share to anonymous.
15. Owner APIs MUST return only an allowlist of safe metadata and MUST NOT disclose another user's records.
16. Auth secrets, passwords, session tokens, verification/reset tokens, request bodies, and sensitive headers MUST NOT be logged.
17. Account features that send email MUST NOT log verification or reset URLs/tokens.

## Reporting

Do not open public issues containing live secrets, credentials, exploit payloads against production, or customer data. Use GitHub private vulnerability reporting when enabled, or contact the repository owner privately.

## Review checklist

Security-sensitive PRs must answer: Does plaintext ever cross a network boundary? Can a new code path expose the URL fragment? Can logs capture secret material? Does a schema change persist key material? Can concurrent requests defeat one-time semantics? Does new client-side script expand the XSS supply-chain surface? Can a client forge ownership? Does a dashboard or owner API return ciphertext, IV, or a reconstructable share URL? Can User A infer User B's records? Does a claim/revoke race return ciphertext more than once?
