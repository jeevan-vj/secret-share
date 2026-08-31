# ADR-002: Optional accounts, owner metadata, and race-safe revocation

Status: Accepted

## Decision

Authentication is optional. Anonymous create/reveal remains supported. When a valid Better Auth session creates a secret, the server stores `owner_user_id` from that session only. Ownership is never taken from the request body or another client claim.

Owner history is a management record, not a recovery mechanism. The dashboard may show an allowlist of metadata (`id`, `createdAt`, `expiresAt`, derived status). It MUST NOT return ciphertext, IV, plaintext, decryption keys, auth/session secrets, or a complete `/s/<id>#k=<key>` link. The service cannot reconstruct the fragment key.

Revocation uses an explicit nullable `revoked_at` column. An owner may revoke only an available (unconsumed, unexpired, unrevoked) share they own. Claim and revoke are both single conditional `UPDATE … RETURNING` mutations. A claim/revoke race has exactly one winner.

Production account features stay behind `ACCOUNTS_ENABLED` until mail delivery, auth secrets, trusted origins, and rate-limit storage are configured.

## Alternatives considered

- **Sentinel status column** instead of `revoked_at`. Rejected: timestamps keep an audit-friendly lifecycle and compose with the existing `consumed_at` / `expires_at` predicates.
- **Soft-delete / destroy ciphertext on revoke.** Rejected for V1: bearer-link unavailability is enough; destroying ciphertext is a later hardening option and would still not recover keys.
- **OAuth/social sign-in.** Rejected without a separate review: extra XSS/script and identity-provider surface on secret pages.

## Account deletion

When a user record is deleted, available owned shares are revoked first. Remaining rows keep the existing `ON DELETE SET NULL` foreign key so consumed/expired/revoked history does not block deletion. Bearer links to already-revoked shares stay unavailable. Anonymous shares are never attached retroactively.

## Consequences

- Session lookup failures on create MUST fail the request (no silent anonymous downgrade).
- Cookie-authenticated mutations MUST enforce the application's trusted-origin policy.
- Rolling back application code after `revoked_at` is in use can make revoked shares claimable again if the old claim predicate is restored. Do not roll back past this lifecycle without keeping the revoke predicate.
