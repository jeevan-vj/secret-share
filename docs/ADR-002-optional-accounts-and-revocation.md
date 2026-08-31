# ADR-002: Optional accounts, owner metadata, and race-safe revocation

Status: Accepted

## Decision

Authentication is optional. Anonymous create/reveal remains the default capability. When a valid signed-in session creates a secret, the server derives `owner_user_id` from that session only. Ownership grants management of safe metadata and revocation of an available share. It never grants decryption, key recovery, or reconstruction of the `/s/<id>#k=<key>` link.

Revocation is an explicit `revoked_at` lifecycle timestamp. Claim and revoke are each a single owner- or availability-filtered `UPDATE ... RETURNING`. A claim racing a revocation has exactly one winner.

Account features ship behind `ACCOUNTS_ENABLED` (default off in production) until mail delivery, trusted origins, and rate-limit dependencies are configured.

## Owner-visible metadata

The dashboard and owner APIs may return only:

- secret id
- createdAt
- expiresAt
- derived status: `available` | `consumed` | `expired` | `revoked`

They must never return ciphertext, IV, algorithm payload, plaintext, decryption keys, auth/session secrets, or a complete share URL.

Status derivation (first match):

1. `revoked` if `revoked_at` is set
2. `consumed` if `consumed_at` is set
3. `expired` if `expires_at <= now`
4. otherwise `available`

## Account deletion

Deleting a user sets `secret.owner_user_id` to NULL (existing FK `ON DELETE SET NULL`). Bearer-link claim remains possible until the share is consumed, expired, or was already revoked. The deleted account cannot recover keys or redisplay the fragment. Residual risk: unused bearer links stay valid after account deletion unless the owner revoked them first.

## Claim vs revoke concurrency

Both transitions require the row to be available (`consumed_at IS NULL`, `revoked_at IS NULL`, `expires_at > now`). SQLite/D1 serializes the writes. Exactly one of claim or revoke can satisfy the predicate.

## Consequences

The product must say plainly that history is management metadata only. Production enablement requires a reviewed mail provider, trusted origins, secure cookies, and rate limits. Schema changes are forward-only (`revoked_at`, Better Auth `account.issuer`).
