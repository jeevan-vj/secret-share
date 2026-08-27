# ADR-001: Client-side encryption with fragment-carried keys

Status: Accepted

## Decision

Encrypt and decrypt secret content exclusively in the browser using AES-256-GCM. Generate a new key per secret. Store ciphertext and IV in D1. Put the exported key in the URL fragment (`#k=`), never in path/query/server state.

## Rationale

URL fragments are not sent as part of HTTP requests, so normal Worker routing and server logs do not receive the key. A D1 compromise therefore does not reveal plaintext without a separately obtained share URL/key.

## Consequences

The service cannot recover lost keys. XSS becomes a critical threat because client JavaScript can access the fragment and decrypted plaintext. Secret pages therefore require unusually strict script discipline and CSP.
