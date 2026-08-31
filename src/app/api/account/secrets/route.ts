import { db } from "@/db/client";
import { decodeOwnerCursor, parseOwnerPageSize } from "@/lib/accounts";
import { requireAccountUser } from "@/lib/current-session";
import { listOwnedSecrets } from "@/services/secrets";

const noStore = { "Cache-Control": "no-store" };

export async function GET(request: Request) {
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

  const url = new URL(request.url);
  const limit = parseOwnerPageSize(url.searchParams.get("limit"));
  const cursor = decodeOwnerCursor(url.searchParams.get("cursor"));
  if (url.searchParams.get("cursor") && !cursor) {
    return Response.json({ error: "invalid_request" }, { status: 400, headers: noStore });
  }

  const result = await listOwnedSecrets(db, {
    ownerUserId: account.userId,
    limit,
    cursor,
  });

  return Response.json(result, { headers: noStore });
}
