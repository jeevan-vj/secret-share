export type AppAuthEnv = {
  BETTER_AUTH_SECRET?: string;
  BETTER_AUTH_URL?: string;
  BETTER_AUTH_TRUSTED_ORIGINS?: string;
  ACCOUNTS_ENABLED?: string;
  MAIL_PROVIDER?: string;
  MAIL_FROM?: string;
  MAIL_API_KEY?: string;
  MAIL_WEBHOOK_URL?: string;
};

export function parseTrustedOrigins(env: AppAuthEnv): string[] {
  const origins = new Set<string>();
  if (env.BETTER_AUTH_URL) {
    try {
      origins.add(new URL(env.BETTER_AUTH_URL).origin);
    } catch {
      // Invalid base URL is handled by Better Auth at startup.
    }
  }
  for (const value of (env.BETTER_AUTH_TRUSTED_ORIGINS ?? "").split(",")) {
    const origin = value.trim();
    if (origin) origins.add(origin);
  }
  return [...origins];
}

export function isAccountsEnabled(env: AppAuthEnv): boolean {
  return env.ACCOUNTS_ENABLED === "true";
}

export function useSecureAuthCookies(env: AppAuthEnv): boolean {
  return (env.BETTER_AUTH_URL ?? "").startsWith("https://");
}

export function mailProvider(env: AppAuthEnv): "none" | "memory" | "resend" | "webhook" {
  const value = env.MAIL_PROVIDER ?? "none";
  if (value === "memory" || value === "resend" || value === "webhook") return value;
  return "none";
}
