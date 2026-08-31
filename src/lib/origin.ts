export function isTrustedMutationRequest(request: Request, trustedOrigins: string[]): boolean {
  if (trustedOrigins.length === 0) return false;
  const origin = request.headers.get("origin");
  if (origin) return trustedOrigins.includes(origin);
  const referer = request.headers.get("referer");
  if (!referer) return false;
  try {
    return trustedOrigins.includes(new URL(referer).origin);
  } catch {
    return false;
  }
}
