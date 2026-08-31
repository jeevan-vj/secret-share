export type AccountsEnv = {
  ACCOUNTS_ENABLED?: string;
  BETTER_AUTH_SECRET?: string;
  BETTER_AUTH_URL?: string;
  AUTH_TRUSTED_ORIGINS?: string;
  AUTH_EMAIL_FROM?: string;
  AUTH_EMAIL_API_KEY?: string;
  AUTH_EMAIL_ENDPOINT?: string;
};

export function isAccountsEnabled(env: AccountsEnv): boolean {
  return env.ACCOUNTS_ENABLED === "true";
}

export function parseTrustedOrigins(env: AccountsEnv): string[] {
  const origins = new Set<string>();
  if (env.BETTER_AUTH_URL) {
    try {
      origins.add(new URL(env.BETTER_AUTH_URL).origin);
    } catch {
      // ignore malformed base URL; callers must fail closed when none remain
    }
  }
  for (const value of (env.AUTH_TRUSTED_ORIGINS ?? "").split(",")) {
    const origin = value.trim();
    if (origin) origins.add(origin);
  }
  return [...origins];
}

export function useSecureAuthCookies(env: AccountsEnv): boolean {
  if (!env.BETTER_AUTH_URL) return true;
  try {
    const url = new URL(env.BETTER_AUTH_URL);
    return url.protocol === "https:";
  } catch {
    return true;
  }
}

export const DEFAULT_OWNER_PAGE_SIZE = 20;
export const MAX_OWNER_PAGE_SIZE = 50;

export function parseOwnerPageSize(value: string | null): number {
  if (!value) return DEFAULT_OWNER_PAGE_SIZE;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return DEFAULT_OWNER_PAGE_SIZE;
  return Math.min(parsed, MAX_OWNER_PAGE_SIZE);
}

export type OwnerCursor = {
  createdAt: string;
  id: string;
};

export function encodeOwnerCursor(cursor: OwnerCursor): string {
  return btoa(`${cursor.createdAt}\0${cursor.id}`).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

export function decodeOwnerCursor(value: string | null): OwnerCursor | null {
  if (!value) return null;
  try {
    const padded = value.replaceAll("-", "+").replaceAll("_", "/");
    const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
    const decoded = atob(padded + pad);
    const separator = decoded.indexOf("\0");
    if (separator <= 0) return null;
    const createdAt = decoded.slice(0, separator);
    const id = decoded.slice(separator + 1);
    if (!createdAt || !id || Number.isNaN(Date.parse(createdAt))) return null;
    return { createdAt, id };
  } catch {
    return null;
  }
}
