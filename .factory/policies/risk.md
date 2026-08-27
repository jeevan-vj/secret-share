# Factory Risk Policy

The deterministic workflow classifier has final authority over merge risk. Agents may recommend a higher risk but may not lower it.

## High risk

Any change touching encryption, authentication, database schemas/migrations, security policy, Cloudflare configuration, GitHub workflows, or production/release behavior.

Examples: `src/lib/crypto.ts`, `src/lib/auth.ts`, `src/db/**`, `drizzle/**`, `SECURITY.md`, `docs/THREAT_MODEL.md`, `wrangler.jsonc`, `.github/**`, `.factory/**`.

Default: agents may implement/review/fix, but auto-merge is blocked. Set `FACTORY_ALLOW_HIGH_RISK_AUTOMERGE=true` only after the factory has demonstrated reliable behavior.

## Medium risk

API routes, service/business logic, validation, authorization-aware UI, dependency changes.

Default: auto-merge is allowed after all verification and independent review gates pass.

## Low risk

Documentation, copy, styling and non-security presentation changes with no API/data/security impact.

Default: auto-merge is allowed after all gates pass.

## Escalation

Any P0/P1 review finding, repeated failed verification, ambiguous requirements, destructive migration, or inability to prove an acceptance criterion becomes `factory:needs-human`.
