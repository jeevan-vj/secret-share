import { db } from "@/db/client";
import {
  claimSecretRecord as claimSecretQuery,
  createSecretRecord as createSecretQuery,
  listOwnedSecrets as listOwnedQuery,
  parseListCursor,
  revokeAvailableSecretsForOwner as revokeAvailableQuery,
  revokeOwnedSecret as revokeOwnedQuery,
} from "@/services/secret-queries";

export async function createSecretRecord(input: {
  ciphertext: string;
  iv: string;
  expiresAt: Date;
  deleteAfterView: boolean;
  algorithm: "A256GCM";
  version: 1;
  ownerUserId?: string | null;
}) {
  return createSecretQuery(db, input);
}

export async function claimSecretRecord(id: string) {
  return claimSecretQuery(db, id);
}

export async function revokeOwnedSecret(ownerUserId: string, id: string) {
  return revokeOwnedQuery(db, ownerUserId, id);
}

export async function revokeAvailableSecretsForOwner(ownerUserId: string) {
  return revokeAvailableQuery(db, ownerUserId);
}

export async function listOwnedSecrets(
  ownerUserId: string,
  input: { limit: number; cursor: string | null },
) {
  const parsed = parseListCursor(input.cursor);
  if (!parsed.ok) return { error: "invalid_cursor" as const };
  return listOwnedQuery(db, ownerUserId, { limit: input.limit, cursor: parsed.cursor });
}
