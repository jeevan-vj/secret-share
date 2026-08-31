import { auth } from "@/lib/auth";
import { hasCookieHeader } from "@/lib/accounts-config";

export class SessionLookupError extends Error {
  readonly code = "session_lookup_failed" as const;

  constructor() {
    super("session_lookup_failed");
    this.name = "SessionLookupError";
  }
}

export type SessionUser = {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string;
};

export async function resolveSessionUser(request: Request): Promise<SessionUser | null> {
  if (!hasCookieHeader(request)) return null;
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    const user = session?.user;
    if (!user?.id) return null;
    return {
      id: user.id,
      email: user.email,
      emailVerified: Boolean(user.emailVerified),
      name: user.name,
    };
  } catch {
    throw new SessionLookupError();
  }
}

export async function resolveSessionUserId(request: Request): Promise<string | null> {
  const user = await resolveSessionUser(request);
  return user?.id ?? null;
}
