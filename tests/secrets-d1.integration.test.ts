import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { claimSecretQuery, claimSecretRecord, createSecretRecord } from "@/services/secrets";
import { startD1Harness, type D1Harness } from "./helpers/d1-harness";

const CIPHERTEXT = "cipher-meta-fixture-aaaa";
const IV = "iv-meta-fixture-bbbb";

function futureExpiry(ms = 60_000) {
  return new Date(Date.now() + ms);
}

async function createAvailableSecret(db: D1Harness["db"], expiresAt = futureExpiry()) {
  return createSecretRecord(db, {
    ciphertext: CIPHERTEXT,
    iv: IV,
    expiresAt,
    deleteAfterView: true,
    algorithm: "A256GCM",
    version: 1,
  });
}

describe("SS-003 D1 one-time claim", { timeout: 30_000 }, () => {
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

  it("applies Drizzle/D1 migrations to a local D1 database", async () => {
    const tables = await harness.d1
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
      .all<{ name: string }>();
    const names = tables.results.map((row) => row.name);

    expect(names).toContain("secret");
    expect(names).toContain("d1_migrations");

    const migrations = await harness.d1
      .prepare("SELECT name FROM d1_migrations ORDER BY name")
      .all<{ name: string }>();
    expect(migrations.results.some((row) => row.name.includes("0000_initial"))).toBe(true);
  });

  it("compiles claim as a single conditional UPDATE ... RETURNING", () => {
    const { sql } = claimSecretQuery(harness.db, "probe-id", new Date()).toSQL();
    const normalized = sql.replace(/\s+/g, " ").toLowerCase();

    expect(normalized.startsWith("update")).toBe(true);
    expect(normalized).toContain("secret");
    expect(normalized).toContain("returning");
    expect(normalized).toMatch(/"consumed_at" is null/);
    expect(normalized).toMatch(/"expires_at"/);
    expect(normalized).not.toMatch(/^\s*select/);
    expect(normalized.split("update").length - 1).toBe(1);
  });

  it("returns ciphertext metadata on first claim and rejects a second claim", async () => {
    const { id } = await createAvailableSecret(harness.db);

    const first = await claimSecretRecord(harness.db, id);
    expect(first).toEqual({
      ciphertext: CIPHERTEXT,
      iv: IV,
      algorithm: "A256GCM",
      version: 1,
    });

    const second = await claimSecretRecord(harness.db, id);
    expect(second).toBeNull();

    const row = await harness.d1
      .prepare("SELECT consumed_at FROM secret WHERE id = ?")
      .bind(id)
      .first<{ consumed_at: number | null }>();
    expect(row?.consumed_at).toEqual(expect.any(Number));
  });

  it("returns unavailable for an expired secret", async () => {
    const { id } = await createAvailableSecret(harness.db, new Date(Date.now() - 1_000));

    await expect(claimSecretRecord(harness.db, id)).resolves.toBeNull();

    const row = await harness.d1
      .prepare("SELECT consumed_at FROM secret WHERE id = ?")
      .bind(id)
      .first<{ consumed_at: number | null }>();
    expect(row?.consumed_at).toBeNull();
  });

  it("allows only one of two concurrent claims to succeed", async () => {
    const { id } = await createAvailableSecret(harness.db);

    const results = await Promise.all([
      claimSecretRecord(harness.db, id),
      claimSecretRecord(harness.db, id),
    ]);

    const successes = results.filter((result) => result !== null);
    const failures = results.filter((result) => result === null);

    expect(successes).toHaveLength(1);
    expect(failures).toHaveLength(1);
    expect(successes[0]).toEqual({
      ciphertext: CIPHERTEXT,
      iv: IV,
      algorithm: "A256GCM",
      version: 1,
    });
  });
});
