import { env } from "cloudflare:workers";
import { createDb } from "./create-db";

type AppEnv = { DB: D1Database };

export const db = createDb((env as unknown as AppEnv).DB);
