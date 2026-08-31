import { db } from "@/db/client";
import { resolveCreateOwner } from "@/lib/session";
import { createSecretSchema } from "@/lib/validation";
import { createSecretRecord } from "@/services/secrets";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }

  const parsed = createSecretSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }

  const owner = await resolveCreateOwner(request);
  if (owner.status === "error") {
    return Response.json({ error: "unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }

  const result = await createSecretRecord(db, {
    ...parsed.data,
    expiresAt: new Date(parsed.data.expiresAt),
    ownerUserId: owner.userId,
  });

  return Response.json(result, {
    status: 201,
    headers: { "Cache-Control": "no-store" },
  });
}
