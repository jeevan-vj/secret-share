export const SHARE_STATUSES = ["available", "consumed", "expired", "revoked"] as const;

export type ShareStatus = (typeof SHARE_STATUSES)[number];

export const OWNER_SHARE_FIELDS = ["id", "createdAt", "expiresAt", "status"] as const;

export type OwnerShare = {
  id: string;
  createdAt: string;
  expiresAt: string;
  status: ShareStatus;
};

export function deriveShareStatus(input: {
  now: Date;
  expiresAt: Date;
  consumedAt: Date | null;
  revokedAt: Date | null;
}): ShareStatus {
  if (input.revokedAt) return "revoked";
  if (input.consumedAt) return "consumed";
  if (input.expiresAt.getTime() <= input.now.getTime()) return "expired";
  return "available";
}

export function toOwnerShare(input: {
  id: string;
  createdAt: Date;
  expiresAt: Date;
  consumedAt: Date | null;
  revokedAt: Date | null;
  now?: Date;
}): OwnerShare {
  return {
    id: input.id,
    createdAt: input.createdAt.toISOString(),
    expiresAt: input.expiresAt.toISOString(),
    status: deriveShareStatus({
      now: input.now ?? new Date(),
      expiresAt: input.expiresAt,
      consumedAt: input.consumedAt,
      revokedAt: input.revokedAt,
    }),
  };
}

export function ownerShareKeys(share: OwnerShare): string[] {
  return Object.keys(share).sort();
}
