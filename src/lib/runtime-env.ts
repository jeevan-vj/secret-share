import { env } from "cloudflare:workers";
import { parseAccountsEnabled, parseTrustedOrigins, usesSecureCookies } from "@/lib/accounts-config";

type AppEnv = {
  DB: D1Database;
  BETTER_AUTH_SECRET?: string;
  BETTER_AUTH_URL?: string;
  ACCOUNTS_ENABLED?: string;
  AUTH_TRUSTED_ORIGINS?: string;
  AUTH_EMAIL_FROM?: string;
  RESEND_API_KEY?: string;
};

export function getAppEnv(): AppEnv {
  return env as unknown as AppEnv;
}

export function isAccountsEnabled(): boolean {
  return parseAccountsEnabled(getAppEnv().ACCOUNTS_ENABLED);
}

export function getTrustedOrigins(): string[] {
  const appEnv = getAppEnv();
  return parseTrustedOrigins(appEnv.BETTER_AUTH_URL, appEnv.AUTH_TRUSTED_ORIGINS);
}

export function getSecureCookies(): boolean {
  return usesSecureCookies(getAppEnv().BETTER_AUTH_URL);
}

export function getMailerConfig(): { apiKey: string; from: string } | null {
  const appEnv = getAppEnv();
  if (!appEnv.RESEND_API_KEY || !appEnv.AUTH_EMAIL_FROM) return null;
  return { apiKey: appEnv.RESEND_API_KEY, from: appEnv.AUTH_EMAIL_FROM };
}
