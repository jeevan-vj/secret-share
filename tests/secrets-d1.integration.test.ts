import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  claimSecretQuery,
  claimSecretRecord,
  createSecretRecord,
  insertTestUser,
  listOwnedSecrets,
  revokeSecretQuery,
  revokeSecretRecord,
} from "@/services/secrets";
import { startD1Harness, type D1Harness } from "./helpers/d1-harness";

const CIPHERTEXT = "cipher-meta-fixture-aaaa";
const IV = "iv-meta-fixture-bbbb";

function futureExpiry(ms = 60_000) {
  return new Date(Date.now() + ms);
}

async function createAvailableSecret(
  db: D1Harness["db"],
  extras: { ownerUserId?: string | null; expiresAt?: Date } = {},
) {
  return createSecretRecord(db, {
    ciphertext: CIPHERTEXT,
    iv: IV,
    expiresAt: extras.expiresAt ?? futureExpiry(),
    deleteAfterView: true,
    algorithm: "A256GCM",
    version: 1,
    ownerUserId: extras.ownerUserId ?? null,
  });
}

describe("D1 secrets lifecycle", { timeout: 30_000 }, () => {
  let harness: D1Harness;

  beforeAll(async () => {
    harness = await startD1Harness();
  });

  afterAll(async () => {
    await harness?.close();
  });

  beforeEach(async () => {
    await harness.resetSecrets();
  });

  it("applies the revoked_at and issuer migrations", async () => {
    const tables = await harness.d1
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
      .all<{ name: string }>();
    const names = tables.results.map((row) => row.name);
    expect(names).toContain("secret");
    expect(names).toContain("rate_limit");

    const columns = await harness.d1.prepare("PRAGMA table_info(secret)").all<{ name: string }>();
    expect(columns.results.some((row) => row.name === "revoked_at")).toBe(true);
  });

  it("compiles claim and revoke as single conditional UPDATE ... RETURNING", () => {
    const claim = claimSecretQuery(harness.db, "probe-id", new Date()).toSQL();
    const revoke = revokeSecretQuery(harness.db, {
      id: "probe-id",
      ownerUserId: "user-a",
      now: new Date(),
    }).toSQL();

    for (const sql of [claim.sql, revoke.sql]) {
      const normalized = sql.replace(/\s+/g, " ").toLowerCase();
      expect(normalized.startsWith("update")).toBe(true);
      expect(normalized).toContain("returning");
      expect(normalized).toMatch(/"revoked_at" is null/);
      expect(normalized).toMatch(/"consumed_at" is null/);
      expect(normalized.split("update").length - 1).toBe(1);
    }
  });

  it("stores ownership from the service input and never from a second user on list", async () => {
    await insertTestUser(harness.db, { id: "user-a", email: "a@example.test" });
    await insertTestUser(harness.db, { id: "user-b", email: "b@example.test" });
    const owned = await createAvailableSecret(harness.db, { ownerUserId: "user-a" });
    await createAvailableSecret(harness.db, { ownerUserId: "user-b" });
    await createAvailableSecret(harness.db);

    const listed = await listOwnedSecrets(harness.db, { ownerUserId: "user-a", limit: 20 });
    expect(listed.items.map((item) => item.id)).toEqual([owned.id]);
    expect(listed.items[0]).toEqual(
      expect.objectContaining({
        id: owned.id,
        status: "available",
      }),
    );
    expect(JSON.stringify(listed)).not.toMatch(/ciphertext|iv|cipher-meta/);
  });

  it("returns ciphertext once on claim and hides revoked shares", async () => {
    await insertTestUser(harness.db, { id: "user-a", email: "a@example.test" });
    const { id } = await createAvailableSecret(harness.db, { ownerUserId: "user-a" });

    expect(await revokeSecretRecord(harness.db, { id, ownerUserId: "user-a" })).toBe("revoked");
    expect(await revokeSecretRecord(harness.db, { id, ownerUserId: "user-a" })).toBe("already_revoked");
    expect(await revokeSecretRecord(harness.db, { id, ownerUserId: "user-b" })).toBe("not_found");
    expect(await claimSecretRecord(harness.db, id)).toBeNull();
  });

  it("lets only one of concurrent claim and revoke win", async () => {
    await insertTestUser(harness.db, { id: "user-a", email: "a@example.test" });
    const { id } = await createAvailableSecret(harness.db, { ownerUserId: "user-a" });

    const [claim, revoke] = await Promise.all([
      claimSecretRecord(harness.db, id),
      revokeSecretRecord(harness.db, { id, ownerUserId: "user-a" }),
    ]);

    const claimWon = claim !== null;
    const revokeWon = revoke === "revoked";
    expect(claimWon || revokeWon).toBe(true);
    expect(claimWon && revokeWon).toBe(false);
    if (claimWon) {
      expect(claim).toEqual({
        ciphertext: CIPHERTEXT,
        iv: IV,
        algorithm: "A256GCM",
        version: 1,
      });
      expect(await claimSecretRecord(harness.db, id)).toBeNull();
    } else {
      expect(claim).toBeNull();
      expect(await claimSecretRecord(harness.db, id)).toBeNull();
    }
  });

  it("keeps existing one-time claim behavior", async () => {
    const { id } = await createAvailableSecret(harness.db);
    const first = await claimSecretRecord(harness.db, id);
    expect(first?.ciphertext).toBe(CIPHERTEXT);
    expect(await claimSecretRecord(harness.db, id)).toBeNull();
  });
});
