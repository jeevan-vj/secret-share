import { accountsEnabled } from "@/lib/accounts";
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

const handler = toNextJsHandler(auth);

async function gated(request: Request, method: (request: Request) => Promise<Response>) {
  if (!accountsEnabled()) {
    return Response.json({ error: "not_found" }, { status: 404, headers: { "Cache-Control": "no-store" } });
  }
  return method(request);
}

export function GET(request: Request) {
  return gated(request, handler.GET);
}

export function POST(request: Request) {
  return gated(request, handler.POST);
}
