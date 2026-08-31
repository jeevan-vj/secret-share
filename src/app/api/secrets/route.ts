import { forbiddenOriginResponse, isTrustedMutationRequest, noStoreJson } from "@/lib/accounts-config";
import { SessionLookupError, resolveSessionUserId } from "@/lib/request-session";
import { getTrustedOrigins } from "@/lib/runtime-env";
import { createSecretSchema } from "@/lib/validation";
import { createSecretRecord } from "@/services/secrets";

export async function POST(request: Request) {
  if (!isTrustedMutationRequest(request, getTrustedOrigins())) {
    return forbiddenOriginResponse();
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return noStoreJson({ error: "invalid_request" }, 400);
  }

  const parsed = createSecretSchema.safeParse(body);
  if (!parsed.success) {
    return noStoreJson({ error: "invalid_request" }, 400);
  }

  let ownerUserId: string | null;
  try {
    ownerUserId = await resolveSessionUserId(request);
  } catch (error) {
    if (error instanceof SessionLookupError) {
      return noStoreJson({ error: "service_unavailable" }, 503);
    }
    throw error;
  }

  const result = await createSecretRecord({
    ciphertext: parsed.data.ciphertext,
    iv: parsed.data.iv,
    expiresAt: new Date(parsed.data.expiresAt),
    deleteAfterView: parsed.data.deleteAfterView,
    algorithm: parsed.data.algorithm,
    version: parsed.data.version,
    ownerUserId,
  });

  return noStoreJson(result, 201);
}
