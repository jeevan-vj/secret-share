import { describe, expect, it } from "vitest";
import { getAuthTables } from "better-auth/db";
import { getTableColumns } from "drizzle-orm";
import { account, session, user, verification } from "../src/db/schema";

function columnNames(table: Parameters<typeof getTableColumns>[0]) {
  return Object.values(getTableColumns(table)).map((column) => column.name).sort();
}

describe("Better Auth 1.7.2 schema contract", () => {
  const expected = getAuthTables({
    emailAndPassword: { enabled: true },
  });

  it("includes the core user, session, account, and verification tables", () => {
    expect(Object.keys(expected).sort()).toEqual(expect.arrayContaining(["account", "session", "user", "verification"]));
  });

  it("maps required user fields including emailVerified", () => {
    expect(columnNames(user)).toEqual(
      expect.arrayContaining(["id", "name", "email", "email_verified", "image", "created_at", "updated_at"]),
    );
    expect(expected.user.fields.emailVerified.fieldName).toBe("emailVerified");
  });

  it("maps session token uniqueness and user foreign key", () => {
    expect(columnNames(session)).toEqual(
      expect.arrayContaining(["id", "user_id", "token", "expires_at", "ip_address", "user_agent", "created_at", "updated_at"]),
    );
    expect(expected.session.fields.token.unique).toBe(true);
    expect(expected.session.fields.userId.references?.onDelete).toBe("cascade");
  });

  it("includes Better Auth 1.7 issuer on account", () => {
    expect(columnNames(account)).toEqual(
      expect.arrayContaining(["issuer", "provider_id", "account_id", "user_id", "password"]),
    );
    expect(expected.account.fields.issuer.required).toBe(true);
    expect(expected.account.fields.issuer.fieldName).toBe("issuer");
  });

  it("keeps verification tokens off the secret table", () => {
    expect(columnNames(verification)).toEqual(
      expect.arrayContaining(["id", "identifier", "value", "expires_at", "created_at", "updated_at"]),
    );
  });
});
