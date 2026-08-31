import { noStoreJson } from "@/lib/accounts-config";
import { parseOwnerListLimit } from "@/lib/secret-cursor";
import { SessionLookupError, resolveSessionUser } from "@/lib/request-session";
import { isAccountsEnabled } from "@/lib/runtime-env";
import { listOwnedSecrets } from "@/services/secrets";

export async function GET(request: Request) {
  if (!isAccountsEnabled()) {
    return noStoreJson({ error: "not_found" }, 404);
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

  const url = new URL(request.url);
  const result = await listOwnedSecrets(owner.id, {
    limit: parseOwnerListLimit(url.searchParams.get("limit")),
    cursor: url.searchParams.get("cursor"),
  });

  if ("error" in result) {
    return noStoreJson({ error: "invalid_request" }, 400);
  }

  return noStoreJson(result);
}
