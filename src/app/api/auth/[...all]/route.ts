import { env } from "cloudflare:workers";
import { toNextJsHandler } from "better-auth/next-js";
import { accountsDisabledResponse, isAccountsEnabled, type AuthRuntime } from "@/lib/auth";
import { auth } from "@/lib/auth-instance";

const handler = toNextJsHandler(auth);

async function gated(request: Request, handle: (request: Request) => Promise<Response>) {
  if (!isAccountsEnabled(env as unknown as AuthRuntime)) {
    return accountsDisabledResponse();
  }
  return handle(request);
}

export function GET(request: Request) {
  return gated(request, handler.GET);
}

export function POST(request: Request) {
  return gated(request, handler.POST);
}
