export const AUTH_MIN_PASSWORD_LENGTH = 12;

export function parseAccountsEnabled(value: string | undefined): boolean {
  return value === "true";
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
