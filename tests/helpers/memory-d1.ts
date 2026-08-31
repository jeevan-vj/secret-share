import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "../../src/db/schema";

class SqliteStatement {
  constructor(
    private readonly sqlite: DatabaseSync,
    private readonly sql: string,
    private readonly params: unknown[] = [],
  ) {}

  bind(...params: unknown[]) {
    return new SqliteStatement(this.sqlite, this.sql, params);
  }

  async first() {
    const row = this.sqlite.prepare(this.sql).get(...(this.params as never[])) as Record<string, unknown> | undefined;
    return row ?? null;
  }

  async all() {
    const results = this.params.length
      ? this.sqlite.prepare(this.sql).all(...(this.params as never[]))
      : this.sqlite.prepare(this.sql).all();
    return { results, success: true as const };
  }

  async run() {
    const info = this.params.length
      ? this.sqlite.prepare(this.sql).run(...(this.params as never[]))
      : this.sqlite.prepare(this.sql).run();
    return {
      success: true as const,
      meta: { changes: info.changes, last_row_id: info.lastInsertRowid },
    };
  }

  async raw() {
    const { results } = await this.all();
    return (results as Record<string, unknown>[]).map((row) => Object.values(row));
  }
}

class SqliteD1 {
  constructor(private readonly sqlite: DatabaseSync) {}

  prepare(sql: string) {
    return new SqliteStatement(this.sqlite, sql);
  }

  async dump() {
    return "";
  }

  async exec(query: string) {
    this.sqlite.exec(query);
    return { count: 0, duration: 0 };
  }

  async batch<T>(statements: SqliteStatement[]) {
    return Promise.all(statements.map((statement) => statement.all())) as Promise<T[]>;
  }
}

export function createSecretsTestDb() {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(readFileSync(new URL("../../drizzle/0000_initial.sql", import.meta.url), "utf8"));
  sqlite.exec(readFileSync(new URL("../../drizzle/0001_accounts_lifecycle.sql", import.meta.url), "utf8"));
  return drizzle(new SqliteD1(sqlite) as unknown as D1Database, { schema });
}
