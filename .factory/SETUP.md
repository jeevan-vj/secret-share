# Factory activation

The workflows are inert until the required secrets/variables exist.

## 1. OpenAI

Create repository secret `OPENAI_API_KEY`. The Codex GitHub Action uses this through its protected Responses API proxy; coding agents do not receive GitHub/Cloudflare credentials.

## 2. Factory policy variables

Repository variables:

- `FACTORY_ALLOW_HIGH_RISK_AUTOMERGE=false` initially.
- `AUTONOMOUS_PRODUCTION=false` initially.

Owner-created issues start automatically. For an issue from anyone else, add `factory:ready` after validating that the request is appropriate.

## 3. GitHub environments

Create `staging` and `production` environments. Put the following secrets in each environment:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `BETTER_AUTH_SECRET`

Set environment variable `BETTER_AUTH_URL` to the public URL for that environment.

For the initial rollout, add yourself as a required reviewer on `production`. Remove that protection only when you intentionally want zero-touch production deploys.

## 4. D1

Create two D1 databases and set repository variables:

- `D1_STAGING_DATABASE_ID`
- `D1_PRODUCTION_DATABASE_ID`

The release workflow materializes the IDs into a temporary Wrangler config, applies `drizzle/*.sql` through `wrangler d1 migrations apply DB --remote`, then deploys.

## 5. Enable autonomy gradually

Recommended progression:

1. Keep both variables false and test issue -> PR -> review/fix.
2. Confirm low/medium-risk PRs merge automatically.
3. Configure staging Cloudflare resources and validate releases.
4. Set `AUTONOMOUS_PRODUCTION=true` while retaining production environment approval.
5. After a reliable history, optionally remove production approval and/or set `FACTORY_ALLOW_HIGH_RISK_AUTOMERGE=true`.

## Test issue

Create an owner-authored low-risk issue such as:

> Add a short explanatory sentence below the expiry text on the create-secret page. Add/update tests if needed. Do not change encryption, APIs, auth, database or deployment behavior.

The expected path is planning -> implementation -> verification -> draft PR -> independent review -> auto-merge -> release verification.
