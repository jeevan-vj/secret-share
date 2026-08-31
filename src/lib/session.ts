import { accountsEnabled } from "@/lib/accounts";
import { auth } from "@/lib/auth";

export type CreateOwnerResolution =
  | { status: "anonymous"; userId: null }
  | { status: "authenticated"; userId: string }
  | { status: "error" };

export async function resolveCreateOwner(request: Request): Promise<CreateOwnerResolution> {
  if (!accountsEnabled()) {
    return { status: "anonymous", userId: null };
  }

  try {
    const result = await auth.api.getSession({ headers: request.headers });
    if (!result?.user?.id) {
      return { status: "anonymous", userId: null };
    }
    return { status: "authenticated", userId: result.user.id };
  } catch {
    return { status: "error" };
  }
}

export async function requireAccountSession(request: Request): Promise<{ userId: string } | { error: Response }> {
  if (!accountsEnabled()) {
    return { error: Response.json({ error: "not_found" }, { status: 404, headers: { "Cache-Control": "no-store" } }) };
  }

  try {
    const result = await auth.api.getSession({ headers: request.headers });
    if (!result?.user?.id) {
      return { error: Response.json({ error: "unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } }) };
    }
    return { userId: result.user.id };
  } catch {
    return { error: Response.json({ error: "unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } }) };
  }
}
