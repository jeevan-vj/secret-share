import { describe, expect, it } from "vitest";
import { deriveOwnerSecretStatus, isOwnerSecretView, toOwnerSecretView } from "../src/lib/secret-status";

const now = new Date("2026-08-31T12:00:00.000Z");

describe("owner secret status derivation", () => {
  it("prefers revoked over consumed or expired", () => {
    expect(
      deriveOwnerSecretStatus(
        {
          revokedAt: now,
          consumedAt: now,
          expiresAt: new Date("2026-08-30T12:00:00.000Z"),
        },
        now,
      ),
    ).toBe("revoked");
  });

  it("marks consumed before expiry", () => {
    expect(
      deriveOwnerSecretStatus(
        {
          revokedAt: null,
          consumedAt: now,
          expiresAt: new Date("2026-09-01T12:00:00.000Z"),
        },
        now,
      ),
    ).toBe("consumed");
  });

  it("marks expired when past expiresAt and not consumed or revoked", () => {
    expect(
      deriveOwnerSecretStatus(
        {
          revokedAt: null,
          consumedAt: null,
          expiresAt: new Date("2026-08-31T11:59:59.000Z"),
        },
        now,
      ),
    ).toBe("expired");
  });

  it("marks available when unconsumed, unrevoked, and unexpired", () => {
    expect(
      deriveOwnerSecretStatus(
        {
          revokedAt: null,
          consumedAt: null,
          expiresAt: new Date("2026-09-01T12:00:00.000Z"),
        },
        now,
      ),
    ).toBe("available");
  });
});

describe("owner secret view allowlist", () => {
  it("returns only id, createdAt, expiresAt, and status", () => {
    const view = toOwnerSecretView(
      {
        id: "abc",
        createdAt: new Date("2026-08-31T11:00:00.000Z"),
        expiresAt: new Date("2026-09-01T11:00:00.000Z"),
        consumedAt: null,
        revokedAt: null,
      },
      now,
    );
    expect(view).toEqual({
      id: "abc",
      createdAt: "2026-08-31T11:00:00.000Z",
      expiresAt: "2026-09-01T11:00:00.000Z",
      status: "available",
    });
    expect(isOwnerSecretView(view)).toBe(true);
    expect(Object.keys(view).sort()).toEqual(["createdAt", "expiresAt", "id", "status"]);
  });
});
