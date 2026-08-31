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
- revoked secrets return the same 404 unavailable response;
- the state transition is expressed as one conditional UPDATE ... RETURNING operation;
- concurrent callers cannot both satisfy the availability predicate.

### SS-004 Authenticated ownership foundation

Better Auth is configured on the same D1 database using its Drizzle adapter. Secret ownership is nullable so anonymous V1 remains possible. Authentication MUST NOT provide the ability to decrypt a secret.

### SS-005 Logging and telemetry

The application MUST NOT log plaintext secrets, decryption keys, request bodies for secret endpoints, or full share URLs.

### SS-006 Browser security

Secret creation/view pages MUST avoid third-party JavaScript. Production response headers MUST target a strict CSP, deny framing, disable MIME sniffing and set a conservative referrer policy.

### SS-007 Optional accounts

Anonymous create and reveal MUST keep working without an account. Signing in adds management capabilities only.

Acceptance criteria:
- create/reveal work with no session cookie;
- account UI is first-party only and compatible with the strict CSP;
- production account features stay behind `ACCOUNTS_ENABLED` until mail, trusted origins, and rate limits are configured;
- verified-email and password-reset flows exist before production enablement;
- a user can sign up, verify email, sign in, sign out, reset a forgotten password, and revoke other active sessions;
- production auth uses secure, HTTP-only cookies with an explicit SameSite policy, trusted origins/base URL, generic anti-enumeration responses, and rate limits on sign-up/sign-in/verification/reset.

### SS-008 Session-derived ownership

When accounts are enabled and a valid signed-in session creates a secret, the server MUST store that session's user id as `owner_user_id`. Ownership is never accepted from the request body or another client claim.

Acceptance criteria:
- anonymous creation stores `NULL`;
- the client cannot choose or forge `owner_user_id`;
- a genuine no-session request remains anonymous;
- session/auth infrastructure failures MUST fail the create request rather than silently creating an unowned secret;
- anonymous shares created before or after sign-in are not retroactively claimed by an account.

### SS-009 Owner dashboard and metadata API

Authenticated owners MAY list paginated management records for shares they created while signed in.

Acceptance criteria:
- queries are filtered server-side by the current user and bounded/paginated;
- responses include only an allowlist of safe metadata: id, createdAt, expiresAt, derived status;
- responses MUST NOT include ciphertext, IV, plaintext, decryption keys, auth/session data, or a complete share URL;
- User A cannot list, inspect, revoke, or infer the existence of User B's records;
- UI copy states that history is management metadata only and that the service cannot recover or redisplay the fragment key or full link;
- the dashboard MUST NOT claim, preview, or decrypt a secret.

### SS-010 Race-safe revocation

An owner MAY revoke an available owned share. After revocation, bearer-link claims return the standard unavailable response.

Acceptance criteria:
- revocation is an explicit `revoked_at` timestamp applied by one owner-filtered conditional UPDATE ... RETURNING;
- claim availability includes `revoked_at IS NULL` and remains a single conditional UPDATE ... RETURNING;
- a claim racing a revocation has exactly one terminal winner; ciphertext is returned at most once;
- non-owners and anonymous callers cannot revoke;
- repeat revocation of an already-revoked owned record is idempotent for that owner;
- revoking a consumed, expired, already revoked (other user), or nonexistent record is non-disclosing and does not make it retrievable;
- mutations are protected against CSRF/cross-origin requests using the session/origin policy;
- `Cache-Control: no-store` remains on secret APIs.

## Explicitly out of scope for V1

- file sharing;
- passphrase-derived encryption;
- recipient email restrictions;
- secret recovery or key escrow;
- server-side decryption;
- analytics scripts on secret pages;
- OAuth/social providers on create/reveal pages;
- exposing whether a bearer-link secret has an owner.

## Definition of done for each feature

A feature is complete only when its spec/acceptance criteria, tests, implementation, migration impact and security impact are all updated in the same PR.
