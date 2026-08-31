import { describe, expect, it } from "vitest";
import { deriveShareStatus, ownerShareKeys, toOwnerShare } from "../src/lib/share-status";

const now = new Date("2026-08-31T00:00:00.000Z");

describe("share status derivation", () => {
  it("prefers revoked over consumed, expiry, and available", () => {
    expect(
      deriveShareStatus({
        now,
        expiresAt: new Date("2026-09-01T00:00:00.000Z"),
        consumedAt: new Date("2026-08-30T00:00:00.000Z"),
        revokedAt: new Date("2026-08-30T12:00:00.000Z"),
      }),
    ).toBe("revoked");
  });

  it("marks consumed before expiry", () => {
    expect(
      deriveShareStatus({
        now,
        expiresAt: new Date("2026-09-01T00:00:00.000Z"),
        consumedAt: new Date("2026-08-30T00:00:00.000Z"),
        revokedAt: null,
      }),
    ).toBe("consumed");
  });

  it("marks expired when unconsumed and unrevoked", () => {
    expect(
      deriveShareStatus({
        now,
        expiresAt: new Date("2026-08-30T00:00:00.000Z"),
        consumedAt: null,
        revokedAt: null,
      }),
    ).toBe("expired");
  });

  it("marks available otherwise", () => {
    expect(
      deriveShareStatus({
        now,
        expiresAt: new Date("2026-09-01T00:00:00.000Z"),
        consumedAt: null,
        revokedAt: null,
      }),
    ).toBe("available");
  });

  it("allowlists owner metadata fields", () => {
    const share = toOwnerShare({
      id: "abc",
      createdAt: now,
      expiresAt: new Date("2026-09-01T00:00:00.000Z"),
      consumedAt: null,
      revokedAt: null,
      now,
    });
    expect(ownerShareKeys(share)).toEqual(["createdAt", "expiresAt", "id", "status"]);
    expect(share).not.toHaveProperty("ciphertext");
    expect(share).not.toHaveProperty("iv");
  });
});
