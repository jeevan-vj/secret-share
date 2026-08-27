import { claimSecretRecord } from "@/services/secrets";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const secret = await claimSecretRecord(id);
  if (!secret) {
    return Response.json({ error: "not_found" }, { status: 404, headers: { "Cache-Control": "no-store" } });
  }

  return Response.json(secret, { headers: { "Cache-Control": "no-store" } });
}
