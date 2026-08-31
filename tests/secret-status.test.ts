import { describe, expect, it } from "vitest";
import { decodeOwnerListCursor, encodeOwnerListCursor } from "../src/lib/secret-cursor";
import { deriveSecretStatus, isOwnerMetadataAllowlist, toOwnerMetadata } from "../src/lib/secret-status";

describe("secret status derivation", () => {
  const now = new Date("2026-08-31T00:00:00.000Z");

  it("prefers revoked, then consumed, then expired, otherwise available", () => {
    expect(
      deriveSecretStatus(
        { consumedAt: now, revokedAt: now, expiresAt: new Date(now.getTime() + 1000) },
        now,
      ),
    ).toBe("revoked");
    expect(
      deriveSecretStatus(
        { consumedAt: now, revokedAt: null, expiresAt: new Date(now.getTime() + 1000) },
        now,
      ),
    ).toBe("consumed");
    expect(
      deriveSecretStatus(
        { consumedAt: null, revokedAt: null, expiresAt: new Date(now.getTime() - 1000) },
        now,
      ),
    ).toBe("expired");
    expect(
      deriveSecretStatus(
        { consumedAt: null, revokedAt: null, expiresAt: new Date(now.getTime() + 1000) },
        now,
      ),
    ).toBe("available");
  });

  it("emits only the owner metadata allowlist", () => {
    const metadata = toOwnerMetadata({
      id: "abc",
      createdAt: now,
      expiresAt: new Date(now.getTime() + 60_000),
      consumedAt: null,
      revokedAt: null,
    }, now);
    expect(isOwnerMetadataAllowlist(metadata)).toBe(true);
    expect(metadata).toEqual({
      id: "abc",
      createdAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + 60_000).toISOString(),
      status: "available",
    });
    expect(JSON.stringify(metadata)).not.toMatch(/ciphertext|iv|key|plaintext|owner/i);
  });
});

describe("owner list cursor", () => {
  it("round-trips createdAt and id", () => {
    const cursor = { createdAt: new Date("2026-08-31T00:00:00.000Z"), id: "abcDEF12_-" };
    expect(decodeOwnerListCursor(encodeOwnerListCursor(cursor))).toEqual(cursor);
    expect(decodeOwnerListCursor("%%%")).toBeNull();
  });
});
