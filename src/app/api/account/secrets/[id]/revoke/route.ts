import { db } from "@/db/client";
import { requireAccountUser, trustedOriginsFromEnv } from "@/lib/current-session";
import { isTrustedMutationRequest } from "@/lib/origin";
import { revokeSecretRecord } from "@/services/secrets";

const noStore = { "Cache-Control": "no-store" };

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isTrustedMutationRequest(request, trustedOriginsFromEnv())) {
    return Response.json({ error: "forbidden" }, { status: 403, headers: noStore });
  }

  const account = await requireAccountUser(request);
  if (account.kind === "disabled") {
    return Response.json({ error: "not_found" }, { status: 404, headers: noStore });
  }
  if (account.kind === "error") {
    return Response.json({ error: "unavailable" }, { status: 503, headers: noStore });
  }
  if (account.kind === "unauthenticated") {
    return Response.json({ error: "unauthorized" }, { status: 401, headers: noStore });
  }

  const { id } = await context.params;
  const result = await revokeSecretRecord(db, { id, ownerUserId: account.userId });

  if (result === "not_found") {
    return Response.json({ error: "not_found" }, { status: 404, headers: noStore });
  }
  if (result === "not_revocable") {
    return Response.json({ error: "not_found" }, { status: 404, headers: noStore });
  }

  return Response.json({ revoked: true }, { headers: noStore });
}
