export const AUTH_MIN_PASSWORD_LENGTH = 12;

export type SocialProvider = "google" | "github";

export type SocialProviderConfig = Partial<
  Record<SocialProvider, { clientId: string; clientSecret: string }>
>;

type SocialProviderEnv = {
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
};

export function parseAccountsEnabled(value: string | undefined): boolean {
  return value === "true";
}

export function parseSocialProviders(env: SocialProviderEnv): {
  config: SocialProviderConfig;
  publicProviders: SocialProvider[];
} {
  const config: SocialProviderConfig = {};
  const googleClientId = env.GOOGLE_CLIENT_ID?.trim();
  const googleClientSecret = env.GOOGLE_CLIENT_SECRET?.trim();
  const githubClientId = env.GITHUB_CLIENT_ID?.trim();
  const githubClientSecret = env.GITHUB_CLIENT_SECRET?.trim();

  if (googleClientId && googleClientSecret) {
    config.google = { clientId: googleClientId, clientSecret: googleClientSecret };
  }
  if (githubClientId && githubClientSecret) {
    config.github = { clientId: githubClientId, clientSecret: githubClientSecret };
  }

  return { config, publicProviders: Object.keys(config) as SocialProvider[] };
}

export function parseTrustedOrigins(baseURL: string | undefined, extra = ""): string[] {
  const origins = new Set<string>();
  for (const candidate of [baseURL, ...extra.split(",")]) {
    const trimmed = candidate?.trim();
    if (!trimmed) continue;
    try {
      origins.add(new URL(trimmed).origin);
    } catch {
      continue;
    }
  }
  return [...origins];
}

export function usesSecureCookies(baseURL: string | undefined): boolean {
  return Boolean(baseURL?.startsWith("https://"));
}

export function hasCookieHeader(request: Request): boolean {
  const cookie = request.headers.get("cookie");
  return Boolean(cookie && cookie.length > 0);
}

export function isTrustedMutationRequest(request: Request, trustedOrigins: string[]): boolean {
  if (!hasCookieHeader(request)) return true;
  const origin = request.headers.get("origin");
  return Boolean(origin && trustedOrigins.includes(origin));
}

export function forbiddenOriginResponse(): Response {
  return Response.json({ error: "forbidden" }, { status: 403, headers: { "Cache-Control": "no-store" } });
}

export function noStoreJson(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}
