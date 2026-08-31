# Secret Share

End-to-end encrypted, one-time secret sharing on Cloudflare Workers.

## Security model

Secrets are encrypted in the browser with AES-256-GCM before upload. The decryption key is placed only in the URL fragment (`#k=...`), which is not sent in HTTP requests. D1 stores ciphertext and operational metadata only.

See [SPEC.md](SPEC.md), [SECURITY.md](SECURITY.md), and [docs/THREAT_MODEL.md](docs/THREAT_MODEL.md).

## Stack

- Next-compatible App Router via vinext
- Cloudflare Workers + D1
- Drizzle ORM
- Better Auth (account/dashboard foundation)
- Web Crypto API
- Zod
- Vitest

## Development

```bash
pnpm install
pnpm test
pnpm typecheck
pnpm dev
```

Create a local D1 database and replace the placeholder database ID in `wrangler.jsonc` before running server persistence locally.

## Optional accounts

Accounts are **disabled by default**. Set `ACCOUNTS_ENABLED=true` only after reviewing mail delivery, trusted origins, and rate limits.

When enabled, a signed-in create stores `owner_user_id` from the Better Auth session. The dashboard lists management metadata only. The service cannot reconstruct `/s/<id>#k=<key>`.

### Environment

| Variable | Purpose |
| --- | --- |
| `BETTER_AUTH_SECRET` | Auth signing secret |
| `BETTER_AUTH_URL` | Public origin / trusted base URL |
| `AUTH_TRUSTED_ORIGINS` | Extra allowed origins (comma-separated) |
| `ACCOUNTS_ENABLED` | `true` to expose auth + owner APIs |
| `AUTH_EMAIL_FROM` | From address for verification/reset |
| `AUTH_EMAIL_API_KEY` | Resend API key |
| `AUTH_EMAIL_ENDPOINT` | Optional Resend-compatible endpoint |

Mail is [Resend](https://resend.com)'s HTTP API. Verification and reset tokens are sent only in email and must not be logged. Production enablement fails closed if mail is unconfigured.

### Migrations and deploy order

1. Apply forward-only `drizzle/0001_accounts_lifecycle.sql` (account `issuer`, `rate_limit`, `secret.revoked_at`).
2. Set auth secrets and trusted origins.
3. Configure Resend and confirm verification/reset mail.
4. Enable `ACCOUNTS_ENABLED=true`.
5. Rollback is flag-only: turning the flag off hides account APIs. Do not drop `revoked_at`; claim now requires it to be null.

`pnpm test` includes D1 integration coverage (`pnpm test:integration` for that suite only).

## Spec-driven TDD workflow

1. Change `SPEC.md`/security invariants first.
2. Add or update acceptance tests so the new behavior fails.
3. Implement the smallest change that makes the tests pass.
4. Refactor without weakening tests.
5. Run `pnpm test`, `pnpm typecheck`, and `pnpm build` before merge.

Never add server-side plaintext secret handling or server-side decryption keys.
