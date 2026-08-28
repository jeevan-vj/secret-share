# AGENTS.md

## Repository purpose

Secret Share is an end-to-end encrypted one-time secret-sharing application. The server stores ciphertext and operational metadata only. Plaintext secrets and client-side decryption keys must never cross the browser/server trust boundary.

## Required reading

Before changing code, read the relevant repository contracts:

- `SPEC.md`
- `SECURITY.md`
- `docs/THREAT_MODEL.md`
- relevant ADRs under `docs/adr/`
- existing tests for the affected behavior

## Security invariants

These are non-negotiable:

1. Encrypt and decrypt secret contents in the browser only.
2. Decryption keys must stay client-side and in the URL fragment. Never send them in request paths, query strings, request bodies, headers, logs, analytics, telemetry, database rows, or server-rendered HTML.
3. Never persist plaintext secrets or decryption keys server-side.
4. Never log plaintext secrets, keys, auth secrets, tokens, full share URLs, or sensitive request bodies.
5. One-time secret claiming must remain atomic and race-safe.
6. Expired or consumed secrets must not be retrievable.
7. Do not weaken validation, authorization, CSP/security controls, migrations, or tests to make a change pass.
8. Treat `.github/**` and `.factory/**` as protected control-plane code. Do not change them unless the task explicitly requires factory work.

## Engineering workflow

For non-trivial work:

1. Understand current behavior and constraints before editing.
2. Produce a short implementation plan and acceptance criteria.
3. Use TDD where practical: add or update a failing test first, then implement the smallest correct change.
4. Keep the change focused on one issue/outcome.
5. Run the required verification:
   - `pnpm install --frozen-lockfile`
   - `pnpm test`
   - `pnpm typecheck`
   - `pnpm build`
6. Review the final diff for unintended security or behavior changes before finishing.

## Dependency policy

- `pnpm-lock.yaml` is authoritative and must be committed.
- Do not use `latest`, floating versions, or regenerate dependency versions incidentally.
- Dependency changes must update both `package.json` and `pnpm-lock.yaml` and are at least medium risk.

## Pull requests

PRs must:

- include `Closes #<issue-number>` for factory work,
- summarize the plan and implementation,
- report tests/typecheck/build results,
- call out security impact,
- explicitly identify migrations, auth/crypto changes, deployment changes, or control-plane changes,
- avoid unrelated refactors.

Factory workers are Cursor Cloud Agents (preferred, `@cursor`) or Codex Cloud (`@codex`).
Independent review may come from allowlisted factory bots in `.factory/review-bots.json`.
Merge/release gating remains GitHub Actions on the trusted default branch.

## Code Review Rules

### Zero-knowledge boundary

Flag any path where plaintext secrets or decryption keys can reach the server, logs, analytics, telemetry, database, query string, request body, server-rendered content, or third-party JavaScript. Keys must remain exclusively client-side and in URL fragments.

### Cryptography

Flag changes that weaken authenticated encryption, randomness, IV handling, encoding integrity, tamper detection, or key separation. Changes to crypto, share-link, encoding, secret creation/reveal pages, or secret APIs are high risk.

### Consume-once semantics

Flag races, retries, caching behavior, or API changes that could reveal a one-time secret more times than allowed or make a consumed/expired secret retrievable.

### Authentication and authorization

Flag any route or data access that relies on client claims without server-side authorization, weakens cookie/session protections, or exposes authenticated metadata across users.

### Logging and telemetry

Flag logging of request bodies, full share links, secrets, ciphertext contents when unnecessary, keys, auth tokens, or sensitive identifiers.

### Factory control plane

Changes under `.github/**` or `.factory/**` must never be considered safe for autonomous merge. They require human merge approval even if all automated checks pass.

### Review severity

Use P0/P1/P2 for findings that should block merge. Prefer concrete exploit/failure paths and actionable fixes over stylistic suggestions.
