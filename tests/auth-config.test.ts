import { describe, expect, it } from "vitest";
import { getAuthTables } from "better-auth";
import { getTableColumns } from "drizzle-orm";
import { account, rateLimit, session, user, verification } from "../src/db/schema";
import { buildAuthOptions } from "../src/lib/auth";
import { createDb } from "../src/db/create-db";

function drizzleColumns(table: Parameters<typeof getTableColumns>[0]) {
  return Object.keys(getTableColumns(table));
}

describe("Better Auth 1.7.2 schema and options", () => {
  it("includes every required auth field for the pinned version", () => {
    const expected = getAuthTables({
      emailAndPassword: { enabled: true },
      rateLimit: { enabled: true, storage: "database" },
    });

    const actual = {
      user: new Set(drizzleColumns(user)),
      session: new Set(drizzleColumns(session)),
      account: new Set(drizzleColumns(account)),
      verification: new Set(drizzleColumns(verification)),
      rateLimit: new Set(drizzleColumns(rateLimit)),
    };

    for (const [model, table] of Object.entries(expected)) {
      const columns = actual[model as keyof typeof actual];
      expect(columns.has("id")).toBe(true);
      for (const field of Object.keys(table.fields)) {
        expect(columns.has(field), `${model}.${field}`).toBe(true);
      }
    }

    expect(actual.account.has("issuer")).toBe(true);
  });

  it("configures production-safe cookies, origins, verification, and rate limits", () => {
    const options = buildAuthOptions({
      env: {
        BETTER_AUTH_SECRET: "a".repeat(32),
        BETTER_AUTH_URL: "https://secret.example",
        AUTH_TRUSTED_ORIGINS: "https://secret.example",
        ACCOUNTS_ENABLED: "true",
      },
      db: createDb({} as D1Database),
      sendMail: async () => undefined,
    });

    expect(options.trustedOrigins).toContain("https://secret.example");
    expect(options.advanced.useSecureCookies).toBe(true);
    expect(options.advanced.defaultCookieAttributes).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      secure: true,
    });
    expect(options.emailAndPassword.requireEmailVerification).toBe(true);
    expect(options.emailVerification.sendOnSignUp).toBe(true);
    expect(options.rateLimit.enabled).toBe(true);
    expect(options.rateLimit.storage).toBe("database");
    expect(options.rateLimit.customRules["/sign-in/email"]).toEqual({ window: 60, max: 5 });
    expect(options.telemetry.enabled).toBe(false);
    expect(options.session.cookieCache.enabled).toBe(false);
  });
});
