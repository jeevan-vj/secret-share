import { accountsEnabledFromEnv, requireAccountUser } from "@/lib/current-session";

const noStore = { "Cache-Control": "no-store" };

export async function GET(request: Request) {
  if (!accountsEnabledFromEnv()) {
    return Response.json({ accountsEnabled: false, user: null }, { headers: noStore });
  }

  const account = await requireAccountUser(request);
  if (account.kind === "error") {
    return Response.json({ error: "unavailable" }, { status: 503, headers: noStore });
  }
  if (account.kind !== "authenticated") {
    return Response.json({ accountsEnabled: true, user: null }, { headers: noStore });
  }

  return Response.json(
    { accountsEnabled: true, user: { email: account.email ?? null } },
    { headers: noStore },
  );
}
