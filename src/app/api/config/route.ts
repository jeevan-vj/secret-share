import { accountsEnabled } from "@/lib/accounts";

export async function GET() {
  return Response.json({ accountsEnabled: accountsEnabled() }, { headers: { "Cache-Control": "no-store" } });
}
