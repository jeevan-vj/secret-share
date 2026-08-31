export type OwnerSecretStatus = "available" | "consumed" | "expired" | "revoked";

export const OWNER_SECRET_PUBLIC_FIELDS = ["id", "createdAt", "expiresAt", "status"] as const;

export type OwnerSecretView = {
  id: string;
  createdAt: string;
  expiresAt: string;
  status: OwnerSecretStatus;
};

export function deriveOwnerSecretStatus(
  row: {
    revokedAt: Date | null;
    consumedAt: Date | null;
    expiresAt: Date;
  },
  now: Date,
): OwnerSecretStatus {
  if (row.revokedAt) return "revoked";
  if (row.consumedAt) return "consumed";
  if (row.expiresAt.getTime() <= now.getTime()) return "expired";
  return "available";
}

export function toOwnerSecretView(
  row: {
    id: string;
    createdAt: Date;
    expiresAt: Date;
    consumedAt: Date | null;
    revokedAt: Date | null;
  },
  now: Date,
): OwnerSecretView {
  return {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    expiresAt: row.expiresAt.toISOString(),
    status: deriveOwnerSecretStatus(row, now),
  };
}

export function isOwnerSecretView(value: unknown): value is OwnerSecretView {
  if (!value || typeof value !== "object") return false;
  const keys = Object.keys(value).sort();
  return keys.join(",") === [...OWNER_SECRET_PUBLIC_FIELDS].sort().join(",");
}
