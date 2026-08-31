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
- the availability predicate is `consumed_at IS NULL AND revoked_at IS NULL AND expires_at > now`;
- concurrent callers cannot both satisfy the availability predicate.

### SS-004 Authenticated ownership foundation

Better Auth is configured on the same D1 database using its Drizzle adapter. Secret ownership is nullable so anonymous V1 remains possible. Authentication MUST NOT provide the ability to decrypt a secret.

### SS-005 Logging and telemetry

The application MUST NOT log plaintext secrets, decryption keys, request bodies for secret endpoints, full share URLs, auth secrets, passwords, session tokens, verification/reset tokens, or sensitive headers.

### SS-006 Browser security

Secret creation/view pages MUST avoid third-party JavaScript. Production response headers MUST target a strict CSP, deny framing, disable MIME sniffing and set a conservative referrer policy.

### SS-007 Optional accounts

Anonymous create and reveal MUST keep working without an account. Signing in adds management capabilities only.

Acceptance criteria:
- first-party email/password sign-up, email verification, sign-in, sign-out, password reset, and revoke-other-sessions are available when accounts are enabled;
- Better Auth social sign-in supports Google and GitHub when a provider's complete credential pair is configured;
- social sign-in uses redirect-based OAuth through the first-party Better Auth endpoint, returns to `/account`, encrypts provider tokens at rest, and never exposes secret contents or fragment keys to an identity provider;
- social identities are linked only when Better Auth's verified-email checks succeed; providers are not force-trusted and different-email linking stays disabled;
- production auth uses HTTP-only cookies with SameSite=Lax, Secure on HTTPS, trusted origins/base URL, generic anti-enumeration responses, and rate limits for sign-up/sign-in/verification/reset;
- accounts stay disabled in production until `ACCOUNTS_ENABLED=true` and a reviewed mailer is configured;
- no OAuth provider script or other third-party script is loaded on create/reveal pages.

### SS-008 Session-derived ownership and owner history

When a valid signed-in session creates a secret, the server stores that session's user ID as `owner_user_id`. Ownership is never accepted from the request body or another client claim.

Acceptance criteria:
- anonymous creation stores `NULL` and is not retroactively claimed after sign-in;
- if session lookup has an infrastructure/internal failure, create fails rather than silently storing an unowned secret;
- a genuine request with no session remains anonymous;
- the owner dashboard/API is paginated, filtered server-side by the current user, and returns only `id`, `createdAt`, `expiresAt`, and derived status (`available`, `consumed`, `expired`, `revoked`);
- dashboard/API responses MUST NOT include ciphertext, IV, plaintext, decryption keys, auth/session secrets, or a complete share URL;
- UI copy MUST state that history is management metadata only and that the service cannot recover the fragment key or redisplay the full link;
- User A cannot list, inspect, revoke, or infer existence of User B's records.

### SS-009 Race-safe owner revocation

An owner may revoke an available owned share. After revocation, bearer-link claims return the standard unavailable response.

Acceptance criteria:
- revocation is owner-only and succeeds only while the share is unconsumed, unexpired, and unrevoked;
- the revoke mutation is one owner-filtered conditional UPDATE ... RETURNING;
- a claim racing a revocation has exactly one winner: either claim returns ciphertext once, or revocation wins and no claim returns ciphertext;
- repeat revocation of an already-revoked owned share is idempotent for that owner;
- consumed, expired, nonexistent, or other-user records return a non-disclosing not-found response and do not become retrievable;
- cookie-authenticated mutations enforce the application's trusted-origin policy.

### SS-010 Account deletion

Deleting a user MUST revoke that user's available owned shares, then rely on `secret.owner_user_id ON DELETE SET NULL` for remaining rows. Anonymous shares are never attached to the deleted or a new account.

## Explicitly out of scope for V1

- file sharing;
- passphrase-derived encryption;
- recipient email restrictions;
- secret recovery or key escrow;
- server-side decryption;
- analytics scripts on secret pages;
- dashboard actions that claim, preview, or decrypt a secret.

## Definition of done for each feature

A feature is complete only when its spec/acceptance criteria, tests, implementation, migration impact and security impact are all updated in the same PR.
