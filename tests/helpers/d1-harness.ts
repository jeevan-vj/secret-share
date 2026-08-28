import { createTestHarness } from "wrangler";
import { createDb, type AppDatabase } from "@/db/create-db";

type D1Env = { DB: D1Database };

export type D1Harness = {
  db: AppDatabase;
  d1: D1Database;
  resetSecrets: () => Promise<void>;
  close: () => Promise<void>;
};

export async function startD1Harness(): Promise<D1Harness> {
  const server = createTestHarness({
    workers: [
      {
        config: {
          name: "secret-share-d1-test",
          main: "./tests/helpers/d1-worker.ts",
          compatibility_date: "2026-08-27",
          d1_databases: [
            {
              binding: "DB",
              database_name: "secret-share",
              database_id: "local-test-db",
              migrations_dir: "drizzle",
            },
          ],
        },
      },
    ],
  });

  await server.listen();
  const worker = server.getWorker<D1Env>();
  await worker.applyD1Migrations("DB");
  const env = await worker.getEnv();

  return {
    db: createDb(env.DB),
    d1: env.DB,
    async resetSecrets() {
      await env.DB.prepare("DELETE FROM secret").run();
    },
    async close() {
      await server.close();
    },
  };
}
