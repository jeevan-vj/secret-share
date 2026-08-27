# Secret Share Software Factory

This directory is the version-controlled contract for autonomous engineering.

## State machine

`issue -> plan -> implement -> verify -> PR -> independent review -> fix/verify loop -> merge -> release`

Owner-created issues start automatically. Other issues require the `factory:ready` label.

## Safety boundaries

- Agents never receive GitHub or Cloudflare deployment credentials.
- Codex runs with workspace/read-only permission profiles; GitHub Actions owns commits, PRs, merges and deployments.
- A generated PR gets at most one automated repair cycle and two independent reviews before escalation.
- P0/P1/P2 findings block merge.
- High-risk changes block auto-merge unless repository variable `FACTORY_ALLOW_HIGH_RISK_AUTOMERGE=true`.
- Production deploy is enabled only when repository variable `AUTONOMOUS_PRODUCTION=true`.
- Production credentials live only in the GitHub `production` environment.

## Required repository secret

- `OPENAI_API_KEY` - used only by `openai/codex-action`.

## Cloudflare release configuration

Secrets:
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Repository/environment variables:
- `D1_STAGING_DATABASE_ID`
- `D1_PRODUCTION_DATABASE_ID`
- `AUTONOMOUS_PRODUCTION` (`true` to deploy production automatically)
- `FACTORY_ALLOW_HIGH_RISK_AUTOMERGE` (`true` to allow autonomous merge of high-risk changes)

Cloudflare deployment remains inactive until the D1 IDs and Cloudflare credentials are configured.
