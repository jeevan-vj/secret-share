import { base64UrlToBytes, bytesToBase64Url } from "@/lib/encoding";

const CURSOR_MAX_CHARS = 256;

export type OwnerListCursor = {
  createdAt: Date;
  id: string;
};

export function encodeOwnerListCursor(cursor: OwnerListCursor): string {
  const payload = `${cursor.createdAt.getTime()}:${cursor.id}`;
  return bytesToBase64Url(new TextEncoder().encode(payload));
}

export function decodeOwnerListCursor(value: string | null | undefined): OwnerListCursor | null {
  if (!value) return null;
  if (value.length > CURSOR_MAX_CHARS) return null;
  try {
    const decoded = new TextDecoder().decode(base64UrlToBytes(value));
    const separator = decoded.indexOf(":");
    if (separator <= 0) return null;
    const createdAtMs = Number(decoded.slice(0, separator));
    const id = decoded.slice(separator + 1);
    if (!Number.isInteger(createdAtMs) || createdAtMs <= 0 || !/^[A-Za-z0-9_-]{8,64}$/.test(id)) return null;
    return { createdAt: new Date(createdAtMs), id };
  } catch {
    return null;
  }
}

export const OWNER_LIST_MAX_LIMIT = 50;
export const OWNER_LIST_DEFAULT_LIMIT = 20;

export function parseOwnerListLimit(value: string | null): number {
  if (!value) return OWNER_LIST_DEFAULT_LIMIT;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return OWNER_LIST_DEFAULT_LIMIT;
  return Math.min(parsed, OWNER_LIST_MAX_LIMIT);
}
