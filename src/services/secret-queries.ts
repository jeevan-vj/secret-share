import { and, desc, eq, gt, isNull, lt, or } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "@/db/schema";
import { secrets } from "@/db/schema";
import { bytesToBase64Url } from "@/lib/encoding";
import { decodeOwnerListCursor, encodeOwnerListCursor, type OwnerListCursor } from "@/lib/secret-cursor";
import { toOwnerMetadata } from "@/lib/secret-status";

export type SecretsDatabase = DrizzleD1Database<typeof schema>;

function randomId(): string {
  return bytesToBase64Url(crypto.getRandomValues(new Uint8Array(16)));
}

export async function createSecretRecord(
  db: SecretsDatabase,
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

export async function claimSecretRecord(db: SecretsDatabase, id: string) {
  const now = new Date();
  const rows = await db
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

  return rows.at(0) ?? null;
}

export type RevokeOutcome = "revoked" | "already_revoked" | "not_found";

export async function revokeOwnedSecret(db: SecretsDatabase, ownerUserId: string, id: string): Promise<RevokeOutcome> {
  const now = new Date();
  const updated = await db
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

  if (updated.at(0)) return "revoked";

  const existing = await db
    .select({ revokedAt: secrets.revokedAt })
    .from(secrets)
    .where(and(eq(secrets.id, id), eq(secrets.ownerUserId, ownerUserId)))
    .limit(1);

  return existing.at(0)?.revokedAt ? "already_revoked" : "not_found";
}

export async function revokeAvailableSecretsForOwner(db: SecretsDatabase, ownerUserId: string): Promise<void> {
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

export async function listOwnedSecrets(
  db: SecretsDatabase,
  ownerUserId: string,
  input: { limit: number; cursor?: OwnerListCursor | null },
) {
  const now = new Date();
  const cursor = input.cursor ?? null;
  const rows = await db
    .select({
      id: secrets.id,
      createdAt: secrets.createdAt,
      expiresAt: secrets.expiresAt,
      consumedAt: secrets.consumedAt,
      revokedAt: secrets.revokedAt,
    })
    .from(secrets)
    .where(
      and(
        eq(secrets.ownerUserId, ownerUserId),
        cursor
          ? or(
              lt(secrets.createdAt, cursor.createdAt),
              and(eq(secrets.createdAt, cursor.createdAt), lt(secrets.id, cursor.id)),
            )
          : undefined,
      ),
    )
    .orderBy(desc(secrets.createdAt), desc(secrets.id))
    .limit(input.limit + 1);

  const page = rows.slice(0, input.limit);
  const next = rows.length > input.limit ? page[page.length - 1] : null;

  return {
    items: page.map((row) => toOwnerMetadata(row, now)),
    nextCursor: next ? encodeOwnerListCursor({ createdAt: next.createdAt, id: next.id }) : null,
  };
}

export function parseListCursor(value: string | null): { ok: true; cursor: OwnerListCursor | null } | { ok: false } {
  if (!value) return { ok: true, cursor: null };
  const cursor = decodeOwnerListCursor(value);
  if (!cursor) return { ok: false };
  return { ok: true, cursor };
}
