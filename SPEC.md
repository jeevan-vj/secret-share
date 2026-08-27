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
