# Factory activation

This factory uses **Cursor Cloud Agents** (preferred) and optionally **Codex Cloud** for implementation and review. GitHub Actions provides deterministic verification and a trusted default-branch controller for merge/release gating.

## 1. Cursor Cloud setup

1. Connect Cursor to this GitHub repository (Cursor Dashboard → Integrations / Cloud Agents).
2. Create an API key at [cursor.com/dashboard/api](https://cursor.com/dashboard/api).
3. Add repository secret `CURSOR_API_KEY`.
4. Keep the Cursor environment minimal: Node 22, pnpm 10, repo access, build/test tooling only.
5. Do **not** put production Cloudflare credentials, production D1 credentials, `BETTER_AUTH_SECRET`, broad GitHub PATs, or personal OAuth/session tokens in the Cursor environment.
6. Optionally create Automations from `.factory/automations/` at [cursor.com/automations](https://cursor.com/automations) for PR review / CI fix loops.

## 2. Codex Cloud (optional fallback)

Connect Codex/ChatGPT to GitHub if you still want `@codex` handoffs. No `OPENAI_API_KEY` is required for subscription-native Codex planning/implementation/review.

Enable native Codex code review if you use that reviewer path. Cursor reviews (`cursor[bot]` / `cursor`) are also accepted by the trusted controller.

## 3. Repository contract

`AGENTS.md` is the durable instruction contract. It defines:

- zero-knowledge security invariants,
- required reading,
- TDD/verification workflow,
- dependency rules,
- PR definition of done,
- review rules and blocking severities.

Do not duplicate large instruction blocks in every issue. The Factory task template supplies the goal and points agents to `AGENTS.md` plus `.factory/agents/*`.

`AGENTS.md`, `.github/**`, and `.factory/**` are protected control-plane paths and always require human merge approval.

## 4. Start factory tasks

Prefer GitHub's **Factory task** issue template. It contains a user-authored `@cursor` handoff and asks the agent to plan, implement with TDD, verify, self-review, and create a PR that closes the issue.

For an existing issue, a user-authored issue comment beginning with `@cursor` (or `@codex`) is also supported. The intake workflow validates that the comment is on an issue (not a PR) and is authored by the repository owner before adding `factory:delegated`.

When provider is Cursor and `CURSOR_API_KEY` is set, intake dispatches a Cloud Agent via `https://api.cursor.com/v1/agents` with `autoCreatePR=true`.

## 5. Trust boundaries

PR-controlled workflows are read-only:

- `Factory PR Gate` checks out candidate code and runs frozen dependency install, tests, typecheck, build, and risk-policy tests.
- `Factory Review Signal` only records that an allowlisted factory review bot submitted a review.

Neither workflow receives issue/PR write permission.

`Factory Trusted Controller` is invoked through `workflow_run`, so its workflow definition comes from the trusted default branch. It checks out only the trusted `.factory` policy/code from the default branch and never executes candidate PR code. It re-reads live GitHub state and requires all of the following before an autonomous merge:

- same-repository PR,
- linked issue carrying `factory:delegated`,
- successful `Factory deterministic gate` for the exact current head,
- latest factory review bot review targets that exact head,
- no inline findings / requested changes in that latest review,
- eligible deterministic risk classification,
- unchanged head and unchanged latest review immediately before merge.

Review/file/comment APIs are paginated and failures are fail-closed. The final merge uses `--match-head-commit`.

Allowlisted review bots live in `.factory/review-bots.json` (Cursor + Codex).

## 6. Central risk policy

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

## 7. Review and repair

Independent factory review (Cursor and/or Codex) is required. `AGENTS.md` contains repository-specific review rules. Automation prompts: `.factory/automations/review.md` and `fix.md`.

For high-risk crypto/auth/secret-storage work, also run a user-authored targeted review before human merge:

> @cursor security review

If the reviewer finds blocking feedback, the PR is not merged. With `CURSOR_API_KEY`, you can comment `@cursor address all current review findings...` to dispatch/repair, or rely on a Fix automation. Without an API identity, add a user-authored follow-up to start repair.

After the PR updates, require a fresh factory review of the new head.

## 8. Reproducible dependencies

Direct dependencies in `package.json` are exact-pinned and `pnpm-lock.yaml` is authoritative. CI, factory verification, and release use:

```bash
pnpm install --frozen-lockfile
```

Dependabot is configured for npm and GitHub Actions updates. Dependency updates must arrive as reviewable PRs and update the lockfile intentionally.

## 9. GitHub main-branch ruleset

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

## 10. GitHub environments and Cloudflare

Deployment remains independent of Cursor/Codex billing/authentication.

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

1. Merge this protected factory change manually after CI is clean.
2. Add `CURSOR_API_KEY` and confirm Cursor↔GitHub repo access.
3. Configure the `main` ruleset and Code Owner review requirement.
4. Open a low-risk Factory task (`@cursor`) and confirm dispatch → PR → frozen CI → factory review → trusted auto-merge.
5. Test a high-risk secret-handling change and confirm it stops for human approval.
6. Configure staging Cloudflare resources and validate release.
7. Add production approval and only later consider autonomous production/high-risk application merges.
