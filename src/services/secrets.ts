import { and, desc, eq, gt, isNull, lt, or } from "drizzle-orm";
import type { AppDatabase } from "@/db/create-db";
import { secrets } from "@/db/schema";
import { toOwnerSecretView, type OwnerSecretView } from "@/lib/secret-status";

function randomId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export async function createSecretRecord(
  db: AppDatabase,
  input: {
    ciphertext: string;
    iv: string;
    expiresAt: Date;
    deleteAfterView: boolean;
    algorithm: "A256GCM";
    version: 1;
    ownerUserId?: string | null;
  },
) {
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

export function revokeOwnedSecretQuery(db: AppDatabase, id: string, ownerUserId: string, now: Date) {
  return db
    .update(secrets)
    .set({ revokedAt: now })
    .where(
      and(
        eq(secrets.id, id),
        eq(secrets.ownerUserId, ownerUserId),
        isNull(secrets.consumedAt),
        isNull(secrets.revokedAt),
        gt(secrets.expiresAt, now),
      ),
    )
    .returning({ id: secrets.id });
}

export type RevokeOwnedSecretResult = "revoked" | "not_found";

export async function revokeOwnedSecret(
  db: AppDatabase,
  input: { id: string; ownerUserId: string },
): Promise<RevokeOwnedSecretResult> {
  const now = new Date();
  const revoked = await revokeOwnedSecretQuery(db, input.id, input.ownerUserId, now);
  if (revoked[0]) return "revoked";

  const existing = await db
    .select({ id: secrets.id, revokedAt: secrets.revokedAt })
    .from(secrets)
    .where(and(eq(secrets.id, input.id), eq(secrets.ownerUserId, input.ownerUserId)))
    .limit(1);

  if (existing[0]?.revokedAt) return "revoked";
  return "not_found";
}

export type OwnerSecretCursor = {
  createdAt: Date;
  id: string;
};

export function encodeOwnerSecretCursor(cursor: OwnerSecretCursor): string {
  return `${cursor.createdAt.getTime()}_${cursor.id}`;
}

export function decodeOwnerSecretCursor(value: string | null | undefined): OwnerSecretCursor | null {
  if (!value) return null;
  const separator = value.indexOf("_");
  if (separator <= 0) return null;
  const time = Number(value.slice(0, separator));
  const id = value.slice(separator + 1);
  if (!id || !Number.isFinite(time)) return null;
  const createdAt = new Date(time);
  if (!Number.isFinite(createdAt.getTime())) return null;
  return { createdAt, id };
}

export async function listOwnedSecrets(
  db: AppDatabase,
  input: { ownerUserId: string; limit: number; cursor?: OwnerSecretCursor | null },
): Promise<{ items: OwnerSecretView[]; nextCursor: string | null }> {
  const now = new Date();
  const ownerPredicate = eq(secrets.ownerUserId, input.ownerUserId);
  const cursorPredicate = input.cursor
    ? or(
        lt(secrets.createdAt, input.cursor.createdAt),
        and(eq(secrets.createdAt, input.cursor.createdAt), lt(secrets.id, input.cursor.id)),
      )
    : undefined;

  const rows = await db
    .select({
      id: secrets.id,
      createdAt: secrets.createdAt,
      expiresAt: secrets.expiresAt,
      consumedAt: secrets.consumedAt,
      revokedAt: secrets.revokedAt,
    })
    .from(secrets)
    .where(cursorPredicate ? and(ownerPredicate, cursorPredicate) : ownerPredicate)
    .orderBy(desc(secrets.createdAt), desc(secrets.id))
    .limit(input.limit + 1);

  const extra = rows.length > input.limit;
  const page = extra ? rows.slice(0, input.limit) : rows;
  const last = page[page.length - 1];
  return {
    items: page.map((row) => toOwnerSecretView(row, now)),
    nextCursor: extra && last ? encodeOwnerSecretCursor({ createdAt: last.createdAt, id: last.id }) : null,
  };
}
