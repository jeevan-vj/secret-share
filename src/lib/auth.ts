import { env } from "cloudflare:workers";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { db } from "@/db/client";
import { authSchema } from "@/db/schema";

type AuthEnv = {
  BETTER_AUTH_SECRET?: string;
  BETTER_AUTH_URL?: string;
};

const appEnv = env as unknown as AuthEnv;

export const auth = betterAuth({
  secret: appEnv.BETTER_AUTH_SECRET,
  baseURL: appEnv.BETTER_AUTH_URL,
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: authSchema,
  }),
  emailAndPassword: { enabled: true },
});
