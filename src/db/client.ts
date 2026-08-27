import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

type AppEnv = { DB: D1Database };

export const db = drizzle((env as unknown as AppEnv).DB, { schema });
