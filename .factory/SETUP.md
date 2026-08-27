# Factory activation

This factory uses **Codex Cloud through the native GitHub integration and your ChatGPT/Codex subscription** for agentic coding. GitHub Actions provides deterministic verification and a trusted default-branch controller for merge/release gating.

No `OPENAI_API_KEY` is required for planning, implementation, or review.

## 1. Connect Codex to GitHub

In Codex/ChatGPT, connect the GitHub account that owns this repository and configure a Codex Cloud environment for `jeevan-vj/secret-share`.

Enable Codex code review for this repository.

## 2. Start factory tasks

Prefer GitHub's **Factory task** issue template. It contains a user-authored `@codex` handoff and instructions to:

1. read the project spec/security contracts,
2. plan the work,
3. implement with TDD,
4. run tests/typecheck/build,
5. create a PR that closes the issue.

The `@codex` mention is intentionally authored by you. GitHub Actions does **not** store or impersonate your ChatGPT login/session.

For an existing issue, a user-authored issue comment beginning with `@codex` is also supported. The intake workflow validates that the comment is on an issue (not a PR) and that it was authored by the repository owner before adding `factory:delegated`.

## 3. Trust boundaries

PR-controlled workflows are read-only:

- `Factory PR Gate` checks out PR code and runs frozen dependency install, tests, typecheck, and build.
- `Factory Codex Review Signal` only records that native Codex submitted a review.

Neither workflow receives issue/PR write permission.

`Factory Trusted Controller` is invoked through `workflow_run`, so its workflow definition comes from the trusted default branch. It never checks out or executes PR content. It re-reads live GitHub state and requires all of the following before an autonomous merge:

- same-repository PR,
- linked issue carrying `factory:delegated`,
- successful `Factory deterministic gate` for the exact current head,
- latest native Codex review targets that exact head,
- no inline findings / requested changes in that latest review,
- eligible risk classification,
- unchanged head and unchanged latest review immediately before merge.

Review and comment APIs are paginated and failures are fail-closed. The final merge uses `--match-head-commit`.

## 4. Risk policy

Repository variable:

- `FACTORY_ALLOW_HIGH_RISK_AUTOMERGE=false` initially.

High-risk application changes include crypto, key-link/encoding helpers, authentication, secret-handling UI/API, D1/schema/migrations, security policy, and Wrangler/deployment configuration.

`.github/**` and `.factory/**` are **protected control-plane paths** and are always human-gated. `FACTORY_ALLOW_HIGH_RISK_AUTOMERGE=true` does not override this rule.

## 5. Review/fix behavior

Codex Cloud implements the issue and opens the PR. GitHub Actions independently verifies the PR. Native Codex code review is the independent reviewer.

If Codex finds blocking feedback, the PR is not merged. Because ChatGPT subscription authentication belongs to the user, Actions does not start a subscription-backed repair task by impersonating the user. Add a user-authored follow-up such as:

> @codex address all current review findings, add regression tests, run pnpm test/typecheck/build, and update this PR.

After Codex updates the PR, request/allow a fresh native Codex review of the new head.

This is the remaining human trigger in subscription-only mode. Fully unattended repair loops require an API/service identity rather than a personal ChatGPT subscription.

## 6. Reproducible dependencies

`package.json` uses exact direct dependency versions and `pnpm-lock.yaml` is committed. CI, factory verification, and release use `pnpm install --frozen-lockfile`, so production installs the dependency graph that was verified.

## 7. GitHub environments and Cloudflare

Deployment remains independent of Codex billing/authentication.

Create `staging` and `production` environments. Put the following secrets in each environment:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `BETTER_AUTH_SECRET`

Set environment variable `BETTER_AUTH_URL` to the public URL for that environment.

For the initial rollout, add yourself as a required reviewer on `production`.

Create two D1 databases and set repository variables:

- `D1_STAGING_DATABASE_ID`
- `D1_PRODUCTION_DATABASE_ID`

The release workflow applies remote D1 migrations and deploys the Worker after a merge to `main`.

## Safe progression

1. Connect Codex Cloud + GitHub and enable code review.
2. Test a low-risk Factory task issue without configuring Cloudflare.
3. Confirm Codex creates a PR and deterministic CI passes.
4. Confirm a clean current-head Codex review plus deterministic CI enables merge.
5. Configure staging Cloudflare resources and validate release.
6. Add production approval and only later consider autonomous production/high-risk application merges.
