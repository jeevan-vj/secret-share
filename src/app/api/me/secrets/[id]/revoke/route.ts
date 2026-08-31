import { forbiddenOriginResponse, isTrustedMutationRequest, noStoreJson } from "@/lib/accounts-config";
import { SessionLookupError, resolveSessionUser } from "@/lib/request-session";
import { getTrustedOrigins, isAccountsEnabled } from "@/lib/runtime-env";
import { revokeOwnedSecret } from "@/services/secrets";

const SECRET_ID = /^[A-Za-z0-9_-]{8,64}$/;

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isAccountsEnabled()) {
    return noStoreJson({ error: "not_found" }, 404);
  }

  if (!isTrustedMutationRequest(request, getTrustedOrigins())) {
    return forbiddenOriginResponse();
  }

  let owner;
  try {
    owner = await resolveSessionUser(request);
  } catch (error) {
    if (error instanceof SessionLookupError) {
      return noStoreJson({ error: "service_unavailable" }, 503);
    }
    throw error;
  }

  if (!owner) {
    return noStoreJson({ error: "unauthorized" }, 401);
  }
  if (!owner.emailVerified) {
    return noStoreJson({ error: "forbidden" }, 403);
  }

  const { id } = await context.params;
  if (!SECRET_ID.test(id)) {
    return noStoreJson({ error: "not_found" }, 404);
  }

  const outcome = await revokeOwnedSecret(owner.id, id);
  if (outcome === "not_found") {
    return noStoreJson({ error: "not_found" }, 404);
  }

  return noStoreJson({ ok: true, status: "revoked" });
}
