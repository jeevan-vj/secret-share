import { env } from "cloudflare:workers";
import { isAccountsEnabled, type AppAuthEnv } from "@/lib/env";

const appEnv = env as unknown as AppAuthEnv;

export function accountsEnabled(): boolean {
  return isAccountsEnabled(appEnv);
}
