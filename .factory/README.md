# Secret Share Software Factory

This directory is the version-controlled contract for autonomous engineering.

## State machine

`issue -> plan -> implement -> verify -> PR -> independent review -> fix/verify loop -> merge -> release`

Owner-created issues start automatically when the body contains `@cursor` (preferred) or `@codex`. Other issues require the `factory:ready` label plus a handoff mention.

## Workers

| Worker | Trigger | Notes |
| --- | --- | --- |
| **Cursor Cloud Agent** | `@cursor` handoff + optional `CURSOR_API_KEY` dispatch | Preferred. Implements/fixes via Cloud Agents API or Automations. |
| **Codex Cloud** | `@codex` handoff via ChatGPT/GitHub integration | Still supported. |
| **GitHub Actions** | PR / review signals | Deterministic verify, risk classify, trusted merge controller. |

Agent role prompts live in `.factory/agents/`. Cursor Automation prompt packs live in `.factory/automations/`.

## Safety boundaries

- Agents never receive GitHub or Cloudflare deployment credentials.
- Cursor/Codex run without production secrets; GitHub Actions owns merges and deployments.
- A generated PR gets at most one automated repair cycle and independent factory reviews before escalation.
- P0/P1/P2 findings block merge.
- High-risk changes block auto-merge unless repository variable `FACTORY_ALLOW_HIGH_RISK_AUTOMERGE=true`.
- Production deploy is enabled only when repository variable `AUTONOMOUS_PRODUCTION=true`.
- Production credentials live only in the GitHub `production` environment.
- `AGENTS.md`, `.github/**`, and `.factory/**` are never auto-merged.

## Required repository secrets

- `CURSOR_API_KEY` — Cursor Dashboard → API Keys. Enables Actions to dispatch Cloud Agents on `@cursor` intake.
- `OPENAI_API_KEY` — optional legacy path only; subscription-native Codex does not need it.

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
