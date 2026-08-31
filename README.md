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

Optional accounts stay off until `ACCOUNTS_ENABLED=true` and mail/auth secrets are configured. See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

Anonymous create/reveal does not require an account. Signing in never recovers the fragment key.

## Spec-driven TDD workflow

1. Change `SPEC.md`/security invariants first.
2. Add or update acceptance tests so the new behavior fails.
3. Implement the smallest change that makes the tests pass.
4. Refactor without weakening tests.
5. Run `pnpm test`, `pnpm typecheck`, and `pnpm build` before merge.

Never add server-side plaintext secret handling or server-side decryption keys.
