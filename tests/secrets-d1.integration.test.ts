import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  claimSecretQuery,
  claimSecretRecord,
  createSecretRecord,
  listOwnedSecrets,
  revokeOwnedSecret,
  revokeOwnedSecretQuery,
} from "@/services/secrets";
import { startD1Harness, type D1Harness } from "./helpers/d1-harness";

const CIPHERTEXT = "cipher-meta-fixture-aaaa";
const IV = "iv-meta-fixture-bbbb";

function futureExpiry(ms = 60_000) {
  return new Date(Date.now() + ms);
}

async function createAvailableSecret(
  db: D1Harness["db"],
  extras: { expiresAt?: Date; ownerUserId?: string | null } = {},
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

describe("D1 secret lifecycle", { timeout: 30_000 }, () => {
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

  it("applies the revoked_at migration to local D1", async () => {
    const columns = await harness.d1.prepare("PRAGMA table_info(secret)").all<{ name: string }>();
    expect(columns.results.map((column) => column.name)).toContain("revoked_at");
    const account = await harness.d1.prepare("PRAGMA table_info(account)").all<{ name: string }>();
    expect(account.results.map((column) => column.name)).toContain("issuer");
  });

  it("compiles claim as a single conditional UPDATE ... RETURNING including revoked_at", () => {
    const { sql } = claimSecretQuery(harness.db, "probe-id", new Date()).toSQL();
    const normalized = sql.replace(/\s+/g, " ").toLowerCase();
    expect(normalized.startsWith("update")).toBe(true);
    expect(normalized).toContain("returning");
    expect(normalized).toMatch(/"consumed_at" is null/);
    expect(normalized).toMatch(/"revoked_at" is null/);
    expect(normalized.split("update").length - 1).toBe(1);
  });

  it("compiles revoke as a single owner-filtered conditional UPDATE ... RETURNING", () => {
    const { sql } = revokeOwnedSecretQuery(harness.db, "probe-id", "owner-1", new Date()).toSQL();
    const normalized = sql.replace(/\s+/g, " ").toLowerCase();
    expect(normalized.startsWith("update")).toBe(true);
    expect(normalized).toContain("returning");
    expect(normalized).toMatch(/"owner_user_id"/);
    expect(normalized).toMatch(/"revoked_at" is null/);
    expect(normalized.split("update").length - 1).toBe(1);
  });

  it("stores session ownership and leaves anonymous creates unowned", async () => {
    await harness.insertUser("owner-1");
    const owned = await createAvailableSecret(harness.db, { ownerUserId: "owner-1" });
    const anonymous = await createAvailableSecret(harness.db);

    const ownedRow = await harness.d1
      .prepare("SELECT owner_user_id FROM secret WHERE id = ?")
      .bind(owned.id)
      .first<{ owner_user_id: string | null }>();
    const anonymousRow = await harness.d1
      .prepare("SELECT owner_user_id FROM secret WHERE id = ?")
      .bind(anonymous.id)
      .first<{ owner_user_id: string | null }>();

    expect(ownedRow?.owner_user_id).toBe("owner-1");
    expect(anonymousRow?.owner_user_id).toBeNull();
  });

  it("lists only the owner's allowlisted metadata", async () => {
    await harness.insertUser("owner-1");
    await harness.insertUser("owner-2");
    const mine = await createAvailableSecret(harness.db, { ownerUserId: "owner-1" });
    await createAvailableSecret(harness.db, { ownerUserId: "owner-2" });

    const listed = await listOwnedSecrets(harness.db, { ownerUserId: "owner-1", limit: 20 });
    expect(listed.items).toHaveLength(1);
    expect(listed.items[0]?.id).toBe(mine.id);
    expect(Object.keys(listed.items[0] ?? {}).sort((a, b) => a.localeCompare(b))).toEqual(["createdAt", "expiresAt", "id", "status"]);
    expect(JSON.stringify(listed)).not.toMatch(/ciphertext|iv/i);
  });

  it("lets the owner revoke an available share and then makes claim unavailable", async () => {
    await harness.insertUser("owner-1");
    const { id } = await createAvailableSecret(harness.db, { ownerUserId: "owner-1" });

    await expect(revokeOwnedSecret(harness.db, { id, ownerUserId: "owner-1" })).resolves.toBe("revoked");
    await expect(revokeOwnedSecret(harness.db, { id, ownerUserId: "owner-1" })).resolves.toBe("revoked");
    await expect(claimSecretRecord(harness.db, id)).resolves.toBeNull();
  });

  it("does not let a non-owner revoke and does not disclose the row", async () => {
    await harness.insertUser("owner-1");
    await harness.insertUser("owner-2");
    const { id } = await createAvailableSecret(harness.db, { ownerUserId: "owner-1" });

    await expect(revokeOwnedSecret(harness.db, { id, ownerUserId: "owner-2" })).resolves.toBe("not_found");
    const claimed = await claimSecretRecord(harness.db, id);
    expect(claimed).toEqual({
      ciphertext: CIPHERTEXT,
      iv: IV,
      algorithm: "A256GCM",
      version: 1,
    });
  });

  it("returns ciphertext once on first claim and rejects a second claim", async () => {
    const { id } = await createAvailableSecret(harness.db);
    await expect(claimSecretRecord(harness.db, id)).resolves.toEqual({
      ciphertext: CIPHERTEXT,
      iv: IV,
      algorithm: "A256GCM",
      version: 1,
    });
    await expect(claimSecretRecord(harness.db, id)).resolves.toBeNull();
  });

  it("returns unavailable for an expired secret", async () => {
    const { id } = await createAvailableSecret(harness.db, { expiresAt: new Date(Date.now() - 1_000) });
    await expect(claimSecretRecord(harness.db, id)).resolves.toBeNull();
  });

  it("allows only one of two concurrent claims to succeed", async () => {
    const { id } = await createAvailableSecret(harness.db);
    const results = await Promise.all([claimSecretRecord(harness.db, id), claimSecretRecord(harness.db, id)]);
    expect(results.filter(Boolean)).toHaveLength(1);
    expect(results.filter((result) => result === null)).toHaveLength(1);
  });

  it("gives claim versus revoke exactly one terminal winner", async () => {
    await harness.insertUser("owner-1");
    const { id } = await createAvailableSecret(harness.db, { ownerUserId: "owner-1" });

    const [claim, revoke] = await Promise.all([
      claimSecretRecord(harness.db, id),
      revokeOwnedSecret(harness.db, { id, ownerUserId: "owner-1" }),
    ]);

    const claimWon = claim !== null;
    const revokeWon = revoke === "revoked";
    expect([claimWon, revokeWon].filter(Boolean)).toHaveLength(1);

    const stored = await harness.d1
      .prepare("SELECT consumed_at, revoked_at FROM secret WHERE id = ?")
      .bind(id)
      .first<{ consumed_at: number | null; revoked_at: number | null }>();

    if (claimWon) {
      expect(claim).toEqual({
        ciphertext: CIPHERTEXT,
        iv: IV,
        algorithm: "A256GCM",
        version: 1,
      });
      expect(stored?.consumed_at).toEqual(expect.any(Number));
      expect(stored?.revoked_at).toBeNull();
    } else {
      expect(stored?.revoked_at).toEqual(expect.any(Number));
      expect(stored?.consumed_at).toBeNull();
    }

    await expect(claimSecretRecord(harness.db, id)).resolves.toBeNull();
  });
});
