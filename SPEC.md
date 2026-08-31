# Secret Share Product Specification

## Goal

Allow a sender to share a sensitive text secret using a link while making the application server unable to decrypt the stored secret.

## V1 scope

### SS-001 Create encrypted secret

Given a sender enters plaintext, when they create a share, then the browser MUST generate a fresh 256-bit AES-GCM key and 96-bit IV, encrypt locally, and submit only ciphertext, IV, expiry and one-time-view metadata to the API.

Acceptance criteria:
- plaintext is never included in the create API payload;
- generated key is cryptographically random;
- same plaintext encrypted twice produces different output;
- ciphertext can be decrypted only with the generated key and IV.

### SS-002 Share-link key isolation

The decryption key MUST exist only in the URL fragment, e.g. `/s/<id>#k=<key>`.

Acceptance criteria:
- API receives only the secret ID;
- link builder never puts the key in path/query parameters;
- server persistence schema has no encryption-key column.

### SS-003 One-time claim

A one-time secret MUST transition from available to consumed atomically. Only the first successful claim returns ciphertext.

Acceptance criteria:
- consumed secrets return 404;
- expired secrets return 404;
- the state transition is expressed as one conditional UPDATE ... RETURNING operation;
- concurrent callers cannot both satisfy the availability predicate.

### SS-004 Authenticated ownership foundation

Better Auth is configured on the same D1 database using its Drizzle adapter. Secret ownership is nullable so anonymous V1 remains possible. Authentication MUST NOT provide the ability to decrypt a secret.

### SS-007 Optional accounts

Anonymous create/reveal MUST keep working without an account. Accounts are a management add-on gated by `ACCOUNTS_ENABLED=true` (disabled by default in production).

Acceptance criteria:
- sign-up, email verification, sign-in, sign-out, password reset, and revoke-other-sessions work when accounts are enabled;
- production auth uses HTTP-only cookies, an explicit SameSite policy, trusted origins/base URL, generic anti-enumeration responses, and rate limits on auth endpoints;
- credentials, session tokens, verification/reset tokens, and request bodies are never logged.

### SS-008 Session-derived ownership

When accounts are enabled and `POST /api/secrets` carries a valid session, the server MUST store that session's user ID as `owner_user_id`. The client MUST NOT be able to choose or forge ownership. A session-lookup infrastructure failure MUST fail the create request instead of silently creating an unowned secret. A genuine no-session request remains anonymous. Existing anonymous shares are never retroactively claimed.

### SS-009 Owner metadata dashboard

An authenticated owner MAY list only their own shares as management metadata: `id`, `createdAt`, `expiresAt`, and derived `status` (`available`, `consumed`, `expired`, `revoked`). Responses MUST exclude ciphertext, IV, plaintext, keys, auth tokens, and complete share URLs. The UI MUST state that the service cannot recover or redisplay the fragment key or full link. User A MUST NOT list, inspect, revoke, or infer User B's records.

### SS-010 Race-safe revocation

An owner MAY revoke an available owned share by setting `revoked_at`. After revocation, bearer-link claim MUST return the same unavailable response used for consumed/expired shares. Claim and revoke are each one conditional `UPDATE ... RETURNING`. A concurrent claim versus revoke has exactly one winner; ciphertext is returned at most once. Repeat revoke of an already-revoked owned share is idempotent. Non-owners, anonymous callers, and consumed/expired/missing IDs receive a non-disclosing failure.

### SS-011 Account deletion

Deleting an account cascades Better Auth rows, revokes still-available owned shares, and sets `secret.owner_user_id` to NULL. Deletion is not key recovery.

### SS-005 Logging and telemetry

The application MUST NOT log plaintext secrets, decryption keys, request bodies for secret endpoints, or full share URLs.

### SS-006 Browser security

Secret creation/view pages MUST avoid third-party JavaScript. Production response headers MUST target a strict CSP, deny framing, disable MIME sniffing and set a conservative referrer policy.

## Explicitly out of scope for V1

- file sharing;
- passphrase-derived encryption;
- recipient email restrictions;
- secret recovery;
- server-side decryption;
- analytics scripts on secret pages.

## Definition of done for each feature

A feature is complete only when its spec/acceptance criteria, tests, implementation, migration impact and security impact are all updated in the same PR.
