export const OWNER_METADATA_FIELDS = ["id", "createdAt", "expiresAt", "status"] as const;

export type OwnerMetadataField = (typeof OWNER_METADATA_FIELDS)[number];
export type SecretLifecycleStatus = "available" | "consumed" | "expired" | "revoked";

export function deriveSecretStatus(
  row: {
    consumedAt: Date | null;
    revokedAt: Date | null;
    expiresAt: Date;
  },
  now = new Date(),
): SecretLifecycleStatus {
  if (row.revokedAt) return "revoked";
  if (row.consumedAt) return "consumed";
  if (row.expiresAt.getTime() <= now.getTime()) return "expired";
  return "available";
}

export function toOwnerMetadata(row: {
  id: string;
  createdAt: Date;
  expiresAt: Date;
  consumedAt: Date | null;
  revokedAt: Date | null;
}, now = new Date()) {
  return {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    expiresAt: row.expiresAt.toISOString(),
    status: deriveSecretStatus(row, now),
  };
}

export function isOwnerMetadataAllowlist(body: unknown): body is Record<OwnerMetadataField, unknown> {
  if (!body || typeof body !== "object") return false;
  const keys = Object.keys(body);
  return keys.length === OWNER_METADATA_FIELDS.length && OWNER_METADATA_FIELDS.every((field) => keys.includes(field));
}
