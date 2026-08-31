import { and, desc, eq, gt, isNull, lt, or } from "drizzle-orm";
import type { AppDatabase } from "@/db/create-db";
import { secrets, user } from "@/db/schema";
import { encodeOwnerCursor, type OwnerCursor } from "@/lib/accounts";
import { toOwnerShare, type OwnerShare } from "@/lib/share-status";

function randomId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export type CreateSecretInput = {
  ciphertext: string;
  iv: string;
  expiresAt: Date;
  deleteAfterView: boolean;
  algorithm: "A256GCM";
  version: 1;
  ownerUserId?: string | null;
};

export async function createSecretRecord(db: AppDatabase, input: CreateSecretInput) {
  const id = randomId();
  await db.insert(secrets).values({
    id,
    ciphertext: input.ciphertext,
    iv: input.iv,
    expiresAt: input.expiresAt,
    deleteAfterView: input.deleteAfterView,
    algorithm: input.algorithm,
    version: input.version,
    ownerUserId: input.ownerUserId ?? null,
    createdAt: new Date(),
  });
  return { id };
}

export function claimSecretQuery(db: AppDatabase, id: string, now: Date) {
  return db
    .update(secrets)
    .set({ consumedAt: now })
    .where(
      and(
        eq(secrets.id, id),
        isNull(secrets.consumedAt),
        isNull(secrets.revokedAt),
        gt(secrets.expiresAt, now),
      ),
    )
    .returning({
      ciphertext: secrets.ciphertext,
      iv: secrets.iv,
      algorithm: secrets.algorithm,
      version: secrets.version,
    });
}

export async function claimSecretRecord(db: AppDatabase, id: string) {
  const rows = await claimSecretQuery(db, id, new Date());
  return rows[0] ?? null;
}

export function revokeSecretQuery(db: AppDatabase, input: { id: string; ownerUserId: string; now: Date }) {
  return db
    .update(secrets)
    .set({ revokedAt: input.now })
    .where(
      and(
        eq(secrets.id, input.id),
        eq(secrets.ownerUserId, input.ownerUserId),
        isNull(secrets.consumedAt),
        isNull(secrets.revokedAt),
        gt(secrets.expiresAt, input.now),
      ),
    )
    .returning({ id: secrets.id });
}

export type RevokeSecretResult = "revoked" | "already_revoked" | "not_revocable" | "not_found";

export async function revokeSecretRecord(
  db: AppDatabase,
  input: { id: string; ownerUserId: string },
): Promise<RevokeSecretResult> {
  const now = new Date();
  const revoked = await revokeSecretQuery(db, { ...input, now });
  if (revoked[0]) return "revoked";

  const existing = await db
    .select({
      revokedAt: secrets.revokedAt,
      consumedAt: secrets.consumedAt,
      expiresAt: secrets.expiresAt,
    })
    .from(secrets)
    .where(and(eq(secrets.id, input.id), eq(secrets.ownerUserId, input.ownerUserId)))
    .limit(1);

  const row = existing[0];
  if (!row) return "not_found";
  if (row.revokedAt) return "already_revoked";
  return "not_revocable";
}

export async function listOwnedSecrets(
  db: AppDatabase,
  input: { ownerUserId: string; limit: number; cursor?: OwnerCursor | null; now?: Date },
): Promise<{ items: OwnerShare[]; nextCursor: string | null }> {
  const now = input.now ?? new Date();
  const filters = [eq(secrets.ownerUserId, input.ownerUserId)];
  if (input.cursor) {
    const cursorCreatedAt = new Date(input.cursor.createdAt);
    filters.push(
      or(
        lt(secrets.createdAt, cursorCreatedAt),
        and(eq(secrets.createdAt, cursorCreatedAt), lt(secrets.id, input.cursor.id)),
      )!,
    );
  }

  const rows = await db
    .select({
      id: secrets.id,
      createdAt: secrets.createdAt,
      expiresAt: secrets.expiresAt,
      consumedAt: secrets.consumedAt,
      revokedAt: secrets.revokedAt,
    })
    .from(secrets)
    .where(and(...filters))
    .orderBy(desc(secrets.createdAt), desc(secrets.id))
    .limit(input.limit + 1);

  const hasMore = rows.length > input.limit;
  const page = hasMore ? rows.slice(0, input.limit) : rows;
  const last = page[page.length - 1];
  return {
    items: page.map((row) => toOwnerShare({ ...row, now })),
    nextCursor: hasMore && last
      ? encodeOwnerCursor({ createdAt: last.createdAt.toISOString(), id: last.id })
      : null,
  };
}

export async function revokeAvailableOwnedSecrets(db: AppDatabase, ownerUserId: string) {
  const now = new Date();
  await db
    .update(secrets)
    .set({ revokedAt: now })
    .where(
      and(
        eq(secrets.ownerUserId, ownerUserId),
        isNull(secrets.consumedAt),
        isNull(secrets.revokedAt),
        gt(secrets.expiresAt, now),
      ),
    );
}

export async function insertTestUser(db: AppDatabase, input: { id: string; email: string; name?: string }) {
  const now = new Date();
  await db.insert(user).values({
    id: input.id,
    name: input.name ?? "Test",
    email: input.email,
    emailVerified: true,
    createdAt: now,
    updatedAt: now,
  });
}
