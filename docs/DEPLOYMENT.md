# Deployment notes for optional accounts and revocation

This feature is high risk: auth, D1 schema, secret APIs, and consume-once lifecycle.

## Feature flag

Production stays disabled until the checklist below is complete:

- `ACCOUNTS_ENABLED=false` (default in `wrangler.jsonc`)
- Set `ACCOUNTS_ENABLED=true` only after mail, secrets, and origins are configured and reviewed

Anonymous create/reveal does not require the flag.

## Environment variables

| Name | Required to enable accounts | Notes |
| --- | --- | --- |
| `BETTER_AUTH_SECRET` | yes | Worker secret. Long random value. Never log. |
| `BETTER_AUTH_URL` | yes | Public origin, e.g. `https://example.workers.dev` |
| `ACCOUNTS_ENABLED` | yes (`true`) | Any value other than `true` leaves accounts off |
| `AUTH_EMAIL_FROM` | yes | Verified Resend from-address |
| `RESEND_API_KEY` | yes | Worker secret. Mailer is Resend's HTTP API |
| `AUTH_TRUSTED_ORIGINS` | optional | Comma-separated extra origins; `BETTER_AUTH_URL` is always trusted |
| `GOOGLE_CLIENT_ID` | optional | Enables Google only when paired with `GOOGLE_CLIENT_SECRET` |
| `GOOGLE_CLIENT_SECRET` | optional | Worker secret; never expose to browser code or logs |
| `GITHUB_CLIENT_ID` | optional | Enables GitHub only when paired with `GITHUB_CLIENT_SECRET` |
| `GITHUB_CLIENT_SECRET` | optional | Worker secret; never expose to browser code or logs |

Local `.env` example values are placeholders only.

## Migration order

Forward-only SQL in `drizzle/0001_accounts_lifecycle.sql`:

1. Add `secret.revoked_at`
2. Add owner+created index
3. Add `account.issuer` (Better Auth 1.7.2) with unique `(issuer, account_id)`
4. Add `rate_limit` for Better Auth database rate-limit storage

Apply the D1 migration **before** or atomically with the Worker that writes `revoked_at` / `issuer`. Do not deploy code that requires those columns onto an unmigrated database.

```bash
pnpm db:migrate:local
# production: wrangler d1 migrations apply secret-share --remote
```

## Rollback limitations

- Do not restore claim code that omits `revoked_at IS NULL` after users have revoked shares; those shares would become claimable again.
- D1 column additions are not practically reversible. Keep the new columns even if account UI is turned back off via `ACCOUNTS_ENABLED=false`.
- Disabling the flag hides account UI and rejects management APIs; anonymous create/reveal and the revoke predicate remain.

## Enablement checklist

1. Apply `0001_accounts_lifecycle.sql` to production D1.
2. Configure `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `AUTH_EMAIL_FROM`, and `RESEND_API_KEY`.
3. Confirm Resend domain/from-address is verified.
4. Confirm Cloudflare WAF/rate-limit rules still cover `/api/auth/*` and secret APIs.
5. For each social provider, register the exact production callback URL: `<BETTER_AUTH_URL>/api/auth/callback/google` or `<BETTER_AUTH_URL>/api/auth/callback/github`. GitHub must be allowed read-only access to the user's email address.
6. Set `ACCOUNTS_ENABLED=true` and deploy.
7. Smoke: sign-up → verify email → sign-in → create owned share → dashboard metadata → revoke → claim 404; test each configured social provider returns to `/account`; concurrent claim/revoke still one winner.

## Control plane

No `.github/**` or `.factory/**` changes are required for this feature.
