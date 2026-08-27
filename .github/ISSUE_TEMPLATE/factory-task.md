---
name: Factory task
about: Delegate a spec-driven implementation to Codex Cloud using your ChatGPT/Codex subscription
title: "factory: "
labels: "factory:ready"
assignees: ""
---

@codex Please take ownership of this issue as a software-engineering task for this repository.

Follow this process:
1. Read `SPEC.md`, `SECURITY.md`, `docs/THREAT_MODEL.md`, relevant ADRs, and existing tests before changing code.
2. Turn the request below into a concrete implementation plan and acceptance criteria.
3. Implement using TDD: add or update tests first where practical, then make the smallest implementation that satisfies them.
4. Run `pnpm test`, `pnpm typecheck`, and `pnpm build` and fix failures caused by the change.
5. Do not weaken security invariants, tests, or validation to make the task pass.
6. Do not modify `.github/**` or `.factory/**` unless the task explicitly requires factory/control-plane work.
7. Create a pull request that includes `Closes #ISSUE_NUMBER` in its body, summarizes the plan and changes, and reports verification results.

## Goal

Describe the desired outcome here.

## Requirements

- 

## Acceptance criteria

- [ ] 

## Constraints / non-goals

- 
