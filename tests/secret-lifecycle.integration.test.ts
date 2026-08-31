import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { secrets, user } from "../src/db/schema";
import { decodeOwnerListCursor } from "../src/lib/secret-cursor";
import {
  claimSecretRecord,
  createSecretRecord,
  listOwnedSecrets,
  revokeOwnedSecret,
} from "../src/services/secret-queries";
import { createSecretsTestDb } from "./helpers/memory-d1";

async function seedUser(db: ReturnType<typeof createSecretsTestDb>, id: string, email: string) {
  const now = new Date();
  await db.insert(user).values({
    id,
    name: id,
    email,
    emailVerified: true,
    createdAt: now,
    updatedAt: now,
  });
}

function ciphertextInput(ownerUserId: string | null, expiresAt = new Date(Date.now() + 60_000)) {
  return {
    ciphertext: "C".repeat(32),
    iv: "D".repeat(16),
    expiresAt,
    deleteAfterView: true as const,
    algorithm: "A256GCM" as const,
    version: 1 as const,
    ownerUserId,
  };
}

function expectOwnerMetadataOnly(result: Awaited<ReturnType<typeof listOwnedSecrets>>) {
  expect(Object.keys(result).sort()).toEqual(["items", "nextCursor"]);
  for (const item of result.items) {
    expect(Object.keys(item).sort()).toEqual(["createdAt", "expiresAt", "id", "status"]);
  }
}

describe("D1-compatible secret lifecycle", () => {
  it("attaches ownership only when provided by the server and lists only that owner's metadata", async () => {
    const db = createSecretsTestDb();
    await seedUser(db, "user-a", "a@example.test");
    await seedUser(db, "user-b", "b@example.test");

    const owned = await createSecretRecord(db, ciphertextInput("user-a"));
    await createSecretRecord(db, ciphertextInput("user-b"));
    await createSecretRecord(db, ciphertextInput(null));

    const list = await listOwnedSecrets(db, "user-a", { limit: 20, cursor: null });
    expect(list.items.map((item) => item.id)).toEqual([owned.id]);
    expect(list.items[0]).toEqual(
      expect.objectContaining({ id: owned.id, status: "available" }),
    );
    expectOwnerMetadataOnly(list);
  });

  it("returns ciphertext at most once and treats revoked shares as unavailable", async () => {
    const db = createSecretsTestDb();
    await seedUser(db, "user-a", "a@example.test");
    const created = await createSecretRecord(db, ciphertextInput("user-a"));

    expect(await revokeOwnedSecret(db, "user-b", created.id)).toBe("not_found");
    expect(await revokeOwnedSecret(db, "user-a", created.id)).toBe("revoked");
    expect(await revokeOwnedSecret(db, "user-a", created.id)).toBe("already_revoked");
    expect(await claimSecretRecord(db, created.id)).toBeNull();
  });

  it("keeps consumed and expired shares unavailable and non-revivable", async () => {
    const db = createSecretsTestDb();
    await seedUser(db, "user-a", "a@example.test");
    const live = await createSecretRecord(db, ciphertextInput("user-a"));
    const expired = await createSecretRecord(db, ciphertextInput("user-a", new Date(Date.now() + 30_000)));

    const claimed = await claimSecretRecord(db, live.id);
    expect(claimed).toEqual({
      ciphertext: "C".repeat(32),
      iv: "D".repeat(16),
      algorithm: "A256GCM",
      version: 1,
    });
    expect(await claimSecretRecord(db, live.id)).toBeNull();
    expect(await revokeOwnedSecret(db, "user-a", live.id)).toBe("not_found");

    await db.update(secrets).set({ expiresAt: new Date(Date.now() - 1000) }).where(eq(secrets.id, expired.id));
    expect(await claimSecretRecord(db, expired.id)).toBeNull();
    expect(await revokeOwnedSecret(db, "user-a", expired.id)).toBe("not_found");
  });

  it("gives exactly one winner when claim and revoke race", async () => {
    const db = createSecretsTestDb();
    await seedUser(db, "user-a", "a@example.test");
    const created = await createSecretRecord(db, ciphertextInput("user-a"));

    const [claimed, revoked] = await Promise.all([
      claimSecretRecord(db, created.id),
      revokeOwnedSecret(db, "user-a", created.id),
    ]);

    const claimWon = Boolean(claimed);
    const revokeWon = revoked === "revoked";
    expect(Number(claimWon) + Number(revokeWon)).toBe(1);
    expect(await claimSecretRecord(db, created.id)).toBeNull();
    if (claimWon) {
      expect(claimed).toMatchObject({ ciphertext: "C".repeat(32), iv: "D".repeat(16) });
      expect(revoked).toBe("not_found");
    } else {
      expect(revoked).toBe("revoked");
      expect(await revokeOwnedSecret(db, "user-a", created.id)).toBe("already_revoked");
    }
  });

  it("paginates owner metadata without mixing users or ciphertext", async () => {
    const db = createSecretsTestDb();
    await seedUser(db, "user-a", "a@example.test");
    await seedUser(db, "user-b", "b@example.test");
    const first = await createSecretRecord(db, ciphertextInput("user-a"));
    const second = await createSecretRecord(db, ciphertextInput("user-a"));
    await createSecretRecord(db, ciphertextInput("user-b"));

    const page1 = await listOwnedSecrets(db, "user-a", { limit: 1, cursor: null });
    expect(page1.items).toHaveLength(1);
    expect(page1.nextCursor).toBeTruthy();
    const page2 = await listOwnedSecrets(db, "user-a", {
      limit: 1,
      cursor: decodeOwnerListCursor(page1.nextCursor),
    });
    expect(page2.items).toHaveLength(1);
    expect(new Set([page1.items[0].id, page2.items[0].id])).toEqual(new Set([first.id, second.id]));
    expectOwnerMetadataOnly(page1);
    expectOwnerMetadataOnly(page2);
  });
});
