# Security Policy and Engineering Invariants

## Non-negotiable invariants

1. Plaintext secret content MUST NEVER reach the server.
2. Secret decryption keys MUST NEVER be persisted or logged server-side.
3. Secret keys MUST be generated with Web Crypto secure randomness.
4. Secret encryption MUST use authenticated encryption (AES-256-GCM in V1).
5. Decryption keys MUST be carried only in URL fragments.
6. Server logs MUST NOT include secret request bodies, ciphertext bodies, full share URLs, auth tokens or keys.
7. Expired or consumed secrets MUST NOT be retrievable.
8. One-time claim MUST be atomic.
9. All API inputs MUST be validated server-side.
10. Third-party scripts are prohibited on secret create/reveal pages unless explicitly security-reviewed.
11. Authenticated ownership MUST NOT imply decryptability.
12. Do not add a "recovery" mechanism that gives the server access to secret keys.

## Reporting

Do not open public issues containing live secrets, credentials, exploit payloads against production, or customer data. Use GitHub private vulnerability reporting when enabled, or contact the repository owner privately.

## Review checklist

Security-sensitive PRs must answer: Does plaintext ever cross a network boundary? Can a new code path expose the URL fragment? Can logs capture secret material? Does a schema change persist key material? Can concurrent requests defeat one-time semantics? Does new client-side script expand the XSS supply-chain surface?
