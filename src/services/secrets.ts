import { and, eq, gt, isNull } from "drizzle-orm";
import type { AppDatabase } from "@/db/create-db";
import { secrets } from "@/db/schema";

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
    .where(and(eq(secrets.id, id), isNull(secrets.consumedAt), gt(secrets.expiresAt, now)))
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
