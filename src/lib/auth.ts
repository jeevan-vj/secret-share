import { env } from "cloudflare:workers";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { db } from "@/db/client";
import { authSchema } from "@/db/schema";
import { createAuthOptions } from "@/lib/auth-options";
import type { AppAuthEnv } from "@/lib/env";

const appEnv = env as unknown as AppAuthEnv;

export const auth = betterAuth({
  ...createAuthOptions(appEnv),
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: authSchema,
  }),
});
