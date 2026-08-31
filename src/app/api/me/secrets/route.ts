import { db } from "@/db/client";
import { requireAccountSession } from "@/lib/session";
import { listOwnedSecretsQuerySchema } from "@/lib/validation";
import { decodeOwnerSecretCursor, listOwnedSecrets } from "@/services/secrets";

export async function GET(request: Request) {
  const session = await requireAccountSession(request);
  if ("error" in session) return session.error;

  const url = new URL(request.url);
  const parsed = listOwnedSecretsQuerySchema.safeParse({
    limit: url.searchParams.get("limit") ?? undefined,
    cursor: url.searchParams.get("cursor") ?? undefined,
  });
  if (!parsed.success) {
    return Response.json({ error: "invalid_request" }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  const cursor = decodeOwnerSecretCursor(parsed.data.cursor);
  if (parsed.data.cursor && !cursor) {
    return Response.json({ error: "invalid_request" }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  const result = await listOwnedSecrets(db, {
    ownerUserId: session.userId,
    limit: parsed.data.limit,
    cursor,
  });

  return Response.json(result, { headers: { "Cache-Control": "no-store" } });
}
