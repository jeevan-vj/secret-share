# Factory activation

This factory uses **Codex Cloud through the native GitHub integration and your ChatGPT/Codex subscription** for implementation and review. GitHub Actions provides deterministic verification and a trusted default-branch controller for merge/release gating.

No `OPENAI_API_KEY` is required for planning, implementation, or review.

## 1. Codex Cloud environment

Connect Codex/ChatGPT to GitHub and configure a Codex Cloud environment for `jeevan-vj/secret-share`.

Keep the environment minimal:

- Node 22
- pnpm 10
- repository access
- only build/test tooling required by the project

Do **not** put production Cloudflare credentials, production D1 credentials, `BETTER_AUTH_SECRET`, broad GitHub PATs, or personal OAuth/session tokens in the Codex environment.

Keep agent internet access disabled unless a task requires it. If it must be enabled, use the smallest practical domain allowlist and disable it again when no longer needed.

Enable native Codex code review for this repository. Prefer automatic review of new PRs if available in the Codex repository settings.

## 2. Repository contract

`AGENTS.md` is the durable instruction contract for Codex implementation and review. It defines:

- zero-knowledge security invariants,
- required reading,
- TDD/verification workflow,
- dependency rules,
- PR definition of done,
- Codex code-review rules and blocking severities.

Do not duplicate large instruction blocks in every issue. The Factory task template supplies the goal and points Codex to `AGENTS.md`.

`AGENTS.md`, `.github/**`, and `.factory/**` are protected control-plane paths and always require human merge approval.

## 3. Start factory tasks

Prefer GitHub's **Factory task** issue template. It contains a user-authored `@codex` handoff and asks Codex to plan, implement with TDD, verify, self-review, and create a PR that closes the issue.

The `@codex` mention is intentionally authored by you. GitHub Actions does **not** store or impersonate your ChatGPT login/session.

For an existing issue, a user-authored issue comment beginning with `@codex` is also supported. The intake workflow validates that the comment is on an issue (not a PR) and is authored by the repository owner before adding `factory:delegated`.

## 4. Trust boundaries

PR-controlled workflows are read-only:

- `Factory PR Gate` checks out candidate code and runs frozen dependency install, tests, typecheck, build, and risk-policy tests.
- `Factory Codex Review Signal` only records that native Codex submitted a review.

Neither workflow receives issue/PR write permission.

`Factory Trusted Controller` is invoked through `workflow_run`, so its workflow definition comes from the trusted default branch. It checks out only the trusted `.factory` policy/code from the default branch and never executes candidate PR code. It re-reads live GitHub state and requires all of the following before an autonomous merge:

- same-repository PR,
- linked issue carrying `factory:delegated`,
- successful `Factory deterministic gate` for the exact current head,
- latest native Codex review targets that exact head,
- no inline findings / requested changes in that latest review,
- eligible deterministic risk classification,
- unchanged head and unchanged latest review immediately before merge.

Review/file/comment APIs are paginated and failures are fail-closed. The final merge uses `--match-head-commit`.

## 5. Central risk policy

Risk classification lives in one tested source of truth:

- `.factory/risk-policy.json`
- `.factory/classify-risk.mjs`
- `tests/risk-policy.test.mjs`

Risk levels:

- `low`: ordinary UI/content changes that do not cross a sensitive boundary.
- `medium`: general API/service/dependency changes.
- `high`: crypto, key-link/encoding helpers, authentication, secret-handling UI/API, database/migrations, security policy, and deployment configuration.
- `protected`: `AGENTS.md`, `.github/**`, `.factory/**`.

Repository variable:

- `FACTORY_ALLOW_HIGH_RISK_AUTOMERGE=false` initially.

The high-risk override never applies to `protected` control-plane changes.

## 6. Review and repair

Native Codex code review is the independent reviewer. `AGENTS.md` contains repository-specific review rules.

For high-risk crypto/auth/secret-storage work, also run a user-authored targeted review before human merge:

> @codex security review

If Codex finds blocking feedback, the PR is not merged. In subscription-only mode, Actions cannot impersonate your ChatGPT account to start the repair task. Add a user-authored follow-up such as:

> @codex address all current review findings, add regression tests, run pnpm test/typecheck/build, and update this PR.

After Codex updates the PR, require a fresh native review of the new head.

This is the intentional human trigger in subscription-only mode. Fully unattended repair loops require an API/service identity rather than a personal ChatGPT subscription.

## 7. Reproducible dependencies

Direct dependencies in `package.json` are exact-pinned and `pnpm-lock.yaml` is authoritative. CI, factory verification, and release use:

```bash
pnpm install --frozen-lockfile
```

Dependabot is configured for npm and GitHub Actions updates. Dependency updates must arrive as reviewable PRs and update the lockfile intentionally.

## 8. GitHub main-branch ruleset

A repository ruleset is required in addition to workflow logic. Configure it in GitHub Settings → Rules → Rulesets for `main`.

Recommended settings:

- require a pull request before merging,
- require `CI / verify`,
- require `Factory deterministic gate`,
- require Sonar/other security checks you intend to enforce,
- require conversation resolution,
- block force pushes,
- block deletion of `main`,
- require branches to be up to date with `main` before merging,
- enable **Require review from Code Owners** so the sensitive paths in `.github/CODEOWNERS` require your approval.

Do not add a global human approval requirement if you want low/medium-risk factory PRs to auto-merge; use Code Owners to target sensitive paths while the trusted controller handles risk gating.

The repository currently cannot create/update this ruleset from the connected GitHub integration, so this is a one-time manual GitHub setting.

## 9. GitHub environments and Cloudflare

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

1. Merge this protected factory change manually after CI/Codex/Sonar are clean.
2. Configure the `main` ruleset and Code Owner review requirement.
3. Enable automatic native Codex reviews.
4. Test a low-risk Factory task without Cloudflare configured.
5. Confirm Codex creates the PR, frozen CI passes, Codex review is clean, and the trusted controller auto-merges it.
6. Test a high-risk secret-handling change and confirm it stops for human approval and targeted security review.
7. Configure staging Cloudflare resources and validate release.
8. Add production approval and only later consider autonomous production/high-risk application merges.
