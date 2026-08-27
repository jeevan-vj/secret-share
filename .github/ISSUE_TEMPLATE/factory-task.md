---
name: Factory task
about: Delegate a spec-driven implementation to Codex Cloud using your ChatGPT/Codex subscription
title: "factory: "
labels: "factory:ready"
assignees: ""
---

@codex Please take ownership of this issue as a software-engineering task for this repository.

Follow the repository contract in `AGENTS.md`. In particular:
1. Read `AGENTS.md`, `SPEC.md`, `SECURITY.md`, `docs/THREAT_MODEL.md`, relevant ADRs, and existing tests before changing code.
2. Turn the request below into a concrete implementation plan and acceptance criteria.
3. Implement using TDD where practical: add or update tests first, then make the smallest correct implementation.
4. Run `pnpm install --frozen-lockfile`, `pnpm test`, `pnpm typecheck`, and `pnpm build` and fix failures caused by the change.
5. Do not weaken security invariants, tests, validation, auth, CSP, or one-time-secret semantics to make the task pass.
6. Do not modify `AGENTS.md`, `.github/**`, or `.factory/**` unless the task explicitly requires protected control-plane work.
7. Review your final diff for security boundary violations and unrelated changes.
8. Create a pull request that includes `Closes #ISSUE_NUMBER` in its body, summarizes the plan and changes, calls out security/deployment/migration impact, and reports verification results.

## Goal

Describe the desired outcome here.

## Requirements

- 

## Acceptance criteria

- [ ] 

## Constraints / non-goals

- 
