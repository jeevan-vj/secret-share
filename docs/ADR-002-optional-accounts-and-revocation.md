# ADR-002: Optional accounts, session-derived ownership, and race-safe revocation

Status: Accepted

## Decision

Authentication is optional. Anonymous create/reveal remains the default capability. When accounts are enabled and a request carries a valid Better Auth session, the server derives `secret.owner_user_id` from that session only. Ownership is never accepted from the client.

Owner dashboards list management metadata (`id`, `createdAt`, `expiresAt`, derived `status`). They never return ciphertext, IV, keys, or a reconstructable `/s/<id>#k=<key>` link. The server does not have the fragment key.

Revocation is an explicit `revoked_at` timestamp. A share is claimable only when `consumed_at IS NULL AND revoked_at IS NULL AND expires_at > now`. Claim and revoke are each a single conditional `UPDATE ... RETURNING`. Concurrent claim vs revoke has exactly one winner.

Accounts stay behind `ACCOUNTS_ENABLED=true`. Production defaults to disabled until mail delivery, cookie/origin configuration, and rate limits are reviewed.

## Account deletion

Deleting a user cascades Better Auth rows and sets `secret.owner_user_id` to NULL (existing FK). Before delete, the service revokes every still-available owned share so leftover bearer links cannot be claimed after the owner is gone. Consumed/expired rows remain as unowned ciphertext until TTL cleanup.

## Consequences

Signing in is not a recovery mechanism. Lost fragment keys are unrecoverable. Metadata (id, timestamps, status) is visible to the owner and to infrastructure. Revocation cannot un-consume a secret that already won a claim race.
