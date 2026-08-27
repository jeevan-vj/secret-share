# Factory activation

This factory uses **Codex Cloud through the native GitHub integration and your ChatGPT/Codex subscription** for agentic coding. GitHub Actions is the deterministic control plane for tests, risk classification, merge gating, and release.

No `OPENAI_API_KEY` is required for planning, implementation, or review.

## 1. Connect Codex to GitHub

In Codex/ChatGPT, connect the GitHub account that owns this repository and configure a Codex Cloud environment for `jeevan-vj/secret-share`.

Enable Codex code review for this repository. The factory review workflow listens for reviews submitted by the Codex GitHub integration and will only auto-merge eligible low/medium-risk factory PRs after that independent review has no blocking P0/P1/P2 findings.

## 2. Start factory tasks

Prefer GitHub's **Factory task** issue template. It contains a user-authored `@codex` handoff and instructions to:

1. read the project spec/security contracts,
2. plan the work,
3. implement with TDD,
4. run tests/typecheck/build,
5. create a PR that closes the issue.

The `@codex` mention is intentionally part of the issue authored by you. GitHub Actions does **not** store or impersonate your ChatGPT login/session.

For an existing issue that does not contain `@codex`, add a user-authored comment such as:

> @codex plan and implement this issue using TDD. Read SPEC.md, SECURITY.md and the threat model first; run pnpm test, pnpm typecheck and pnpm build; then create a PR that closes this issue.

## 3. Factory policy variable

Repository variable:

- `FACTORY_ALLOW_HIGH_RISK_AUTOMERGE=false` initially.

High-risk changes include crypto, authentication, D1/schema/migrations, security policy, Wrangler/deployment configuration, and factory/control-plane files. They stop for human approval unless this variable is deliberately enabled.

## 4. Review/fix behavior

Codex Cloud implements the issue and opens the PR. GitHub Actions independently runs tests, typecheck and build and classifies risk.

Codex's native GitHub code review is the independent reviewer. If it submits blocking P0/P1/P2 feedback, the PR is not merged. Because ChatGPT subscription authentication belongs to the user, Actions does not try to start a subscription-backed repair task by impersonating the user. Add a user-authored follow-up such as:

> @codex address all current review findings, add regression tests, run pnpm test/typecheck/build, and update this PR.

After Codex updates the PR and the native review re-runs cleanly, low/medium-risk PRs can be auto-merged.

This is the one remaining human trigger in subscription-only mode. Fully unattended repair loops require an API/service identity rather than a personal ChatGPT subscription.

## 5. GitHub environments and Cloudflare

Deployment remains independent of Codex billing/authentication.

Create `staging` and `production` environments. Put the following secrets in each environment:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `BETTER_AUTH_SECRET`

Set environment variable `BETTER_AUTH_URL` to the public URL for that environment.

For the initial rollout, add yourself as a required reviewer on `production`.

## 6. D1

Create two D1 databases and set repository variables:

- `D1_STAGING_DATABASE_ID`
- `D1_PRODUCTION_DATABASE_ID`

The release workflow applies remote D1 migrations and deploys the Worker after a merge to `main`.

## Safe progression

1. Connect Codex Cloud + GitHub and enable code review.
2. Test a low-risk Factory task issue without configuring Cloudflare.
3. Confirm Codex creates a PR and deterministic CI passes.
4. Confirm native Codex review triggers the review gate and low/medium-risk auto-merge.
5. Configure staging Cloudflare resources and validate release.
6. Add production approval and only later consider autonomous production/high-risk merges.
