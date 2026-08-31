import { env } from "cloudflare:workers";
import { db } from "@/db/client";
import { parseTrustedOrigins, type AppAuthEnv } from "@/lib/env";
import { isTrustedMutationRequest } from "@/lib/origin";
import { requireAccountSession } from "@/lib/session";
import { secretIdParamSchema } from "@/lib/validation";
import { revokeOwnedSecret } from "@/services/secrets";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const trustedOrigins = parseTrustedOrigins(env as unknown as AppAuthEnv);
  if (!isTrustedMutationRequest(request, trustedOrigins)) {
    return Response.json({ error: "forbidden" }, { status: 403, headers: { "Cache-Control": "no-store" } });
  }

  const session = await requireAccountSession(request);
  if ("error" in session) return session.error;

  const { id } = await context.params;
  if (!secretIdParamSchema.safeParse(id).success) {
    return Response.json({ error: "not_found" }, { status: 404, headers: { "Cache-Control": "no-store" } });
  }

  const result = await revokeOwnedSecret(db, { id, ownerUserId: session.userId });
  if (result === "not_found") {
    return Response.json({ error: "not_found" }, { status: 404, headers: { "Cache-Control": "no-store" } });
  }

  return Response.json({ status: "revoked" }, { headers: { "Cache-Control": "no-store" } });
}
