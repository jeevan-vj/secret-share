import { db } from "@/db/client";
import { resolveOwnerForCreate } from "@/lib/current-session";
import { createSecretSchema } from "@/lib/validation";
import { createSecretRecord } from "@/services/secrets";

const noStore = { "Cache-Control": "no-store" };

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_request" }, { status: 400, headers: noStore });
  }

  const parsed = createSecretSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "invalid_request" }, { status: 400, headers: noStore });
  }

  const owner = await resolveOwnerForCreate(request);
  if (owner.kind === "error") {
    return Response.json({ error: "unavailable" }, { status: 503, headers: noStore });
  }

  const result = await createSecretRecord(db, {
    ciphertext: parsed.data.ciphertext,
    iv: parsed.data.iv,
    expiresAt: new Date(parsed.data.expiresAt),
    deleteAfterView: parsed.data.deleteAfterView,
    algorithm: parsed.data.algorithm,
    version: parsed.data.version,
    ownerUserId: owner.kind === "authenticated" ? owner.userId : null,
  });

  return Response.json(result, { status: 201, headers: noStore });
}
