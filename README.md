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

## Database integration tests

`pnpm test` runs unit tests and D1 integration tests together (CI uses this script).

The D1 tests start Wrangler's local test harness, apply Drizzle migrations from `drizzle/` onto a Miniflare D1 database, and exercise SPEC SS-003 one-time claim through the persistence/service layer:

- first claim returns ciphertext metadata; a second claim is unavailable
- expired secrets are unavailable
- two concurrent claims yield exactly one success

Run only those tests with `pnpm test:integration`. No extra dependencies or manual Wrangler steps are required. Test fixtures use opaque ciphertext/IV tokens and never log plaintext, keys, or share URLs.

## Spec-driven TDD workflow

1. Change `SPEC.md`/security invariants first.
2. Add or update acceptance tests so the new behavior fails.
3. Implement the smallest change that makes the tests pass.
4. Refactor without weakening tests.
5. Run `pnpm test`, `pnpm typecheck`, and `pnpm build` before merge.

Never add server-side plaintext secret handling or server-side decryption keys.
