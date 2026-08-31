import { env } from "cloudflare:workers";
import { db } from "@/db/client";
import { createAuth, type AuthRuntime } from "@/lib/auth";

export const auth = createAuth({
  env: env as unknown as AuthRuntime,
  db,
});
