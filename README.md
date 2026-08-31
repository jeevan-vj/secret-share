# Secret Share

End-to-end encrypted, one-time secret sharing on Cloudflare Workers.

## Security model

Secrets are encrypted in the browser with AES-256-GCM before upload. The decryption key is placed only in the URL fragment (`#k=...`), which is not sent in HTTP requests. D1 stores ciphertext and operational metadata only.

Optional accounts add owned-share history and revocation. They do not recover keys or reconstruct `/s/<id>#k=<key>` links. See [SPEC.md](SPEC.md), [SECURITY.md](SECURITY.md), [docs/THREAT_MODEL.md](docs/THREAT_MODEL.md), and [docs/ADR-002-optional-accounts-and-revocation.md](docs/ADR-002-optional-accounts-and-revocation.md).

## Stack

- Next-compatible App Router via vinext
- Cloudflare Workers + D1
- Drizzle ORM
- Better Auth (optional accounts)
- Web Crypto API
- Zod
- Vitest

## Development

```bash
pnpm install
pnpm test
pnpm test:integration
pnpm typecheck
pnpm dev
```

Create a local D1 database and replace the placeholder database ID in `wrangler.jsonc` before running server persistence locally.

Apply migrations with `pnpm db:migrate:local` after pulling schema changes (`drizzle/0001_account_issuer_and_secret_revoked.sql` adds `account.issuer` and `secret.revoked_at`).

## Optional accounts

`ACCOUNTS_ENABLED` defaults to `false` in production. Leave it off until:

1. `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` are set.
2. `BETTER_AUTH_TRUSTED_ORIGINS` lists every browser origin that may call auth and revoke APIs.
3. A reviewed mail provider is configured (`MAIL_PROVIDER=resend` or `webhook`, plus `MAIL_FROM` and credentials). Verification and reset tokens must never be logged.
4. Cloudflare rate limiting complements Better Auth's auth-endpoint limits.

When enabled, signed-in creates store `owner_user_id` from the session. The dashboard lists only id, createdAt, expiresAt, and derived status. Revoke is owner-only and race-safe against claim.

Rollback: set `ACCOUNTS_ENABLED=false`. Forward-only columns stay; existing `revoked_at` values remain in force. Account deletion unlinks ownership (`ON DELETE SET NULL`) and does not recover keys. Unrevoked bearer links stay claimable until expiry or consume.

## Spec-driven TDD workflow

1. Change `SPEC.md`/security invariants first.
2. Add or update acceptance tests so the new behavior fails.
3. Implement the smallest change that makes the tests pass.
4. Refactor without weakening tests.
5. Run `pnpm test`, `pnpm typecheck`, and `pnpm build` before merge.

Never add server-side plaintext secret handling or server-side decryption keys.
