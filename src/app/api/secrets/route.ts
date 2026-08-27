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

  const result = await createSecretRecord({
    ...parsed.data,
    expiresAt: new Date(parsed.data.expiresAt),
  });

  return Response.json(result, {
    status: 201,
    headers: { "Cache-Control": "no-store" },
  });
}
