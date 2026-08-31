import { db } from "@/db/client";
import { claimSecretRecord } from "@/services/secrets";

const noStore = { "Cache-Control": "no-store" };

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const secret = await claimSecretRecord(db, id);
  if (!secret) {
    return Response.json({ error: "not_found" }, { status: 404, headers: noStore });
  }

  return Response.json(secret, { headers: noStore });
}
