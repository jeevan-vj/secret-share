export function isTrustedMutationRequest(request: Request, trustedOrigins: string[]): boolean {
  const allowed = new Set(trustedOrigins);
  const origin = request.headers.get("origin");
  if (origin) return allowed.has(origin);

  const site = request.headers.get("sec-fetch-site");
  if (site === "same-origin") return true;

  const referer = request.headers.get("referer");
  if (!referer) return false;
  try {
    return allowed.has(new URL(referer).origin);
  } catch {
    return false;
  }
}
