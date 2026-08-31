import { env } from "cloudflare:workers";
import { isAccountsEnabled, parseTrustedOrigins, type AccountsEnv } from "@/lib/accounts";
import { auth } from "@/lib/auth-instance";
import { requireAuthenticatedUser, resolveRequestSession, type SessionLookupResult } from "@/lib/request-session";

function lookupSession(request: Request) {
  return auth.api.getSession({ headers: request.headers });
}

export async function resolveOwnerForCreate(request: Request): Promise<SessionLookupResult> {
  if (!isAccountsEnabled(env as unknown as AccountsEnv)) {
    return { kind: "anonymous" };
  }
  return resolveRequestSession(async () => {
    const session = await lookupSession(request);
    return session ? { user: { id: session.user.id } } : null;
  });
}

export async function requireAccountUser(request: Request) {
  if (!isAccountsEnabled(env as unknown as AccountsEnv)) {
    return { kind: "disabled" as const };
  }
  return requireAuthenticatedUser(async () => {
    const session = await lookupSession(request);
    if (!session) return null;
    return { user: { id: session.user.id, email: session.user.email, name: session.user.name } };
  });
}

export function trustedOriginsFromEnv() {
  return parseTrustedOrigins(env as unknown as AccountsEnv);
}

export function accountsEnabledFromEnv() {
  return isAccountsEnabled(env as unknown as AccountsEnv);
}
