export type SessionLookupResult =
  | { kind: "anonymous" }
  | { kind: "authenticated"; userId: string }
  | { kind: "error"; error: "session_unavailable" };

export async function resolveRequestSession(
  lookup: () => Promise<{ user: { id: string } } | null>,
): Promise<SessionLookupResult> {
  try {
    const session = await lookup();
    if (!session?.user?.id) return { kind: "anonymous" };
    return { kind: "authenticated", userId: session.user.id };
  } catch {
    return { kind: "error", error: "session_unavailable" };
  }
}

export async function requireAuthenticatedUser(
  lookup: () => Promise<{ user: { id: string; email?: string; name?: string } } | null>,
): Promise<
  | { kind: "authenticated"; userId: string; email?: string; name?: string }
  | { kind: "unauthenticated" }
  | { kind: "error"; error: "session_unavailable" }
> {
  try {
    const session = await lookup();
    if (!session?.user?.id) return { kind: "unauthenticated" };
    return {
      kind: "authenticated",
      userId: session.user.id,
      email: session.user.email,
      name: session.user.name,
    };
  } catch {
    return { kind: "error", error: "session_unavailable" };
  }
}
