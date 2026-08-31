import { getTableColumns } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { account, BETTER_AUTH_CORE_FIELDS, rateLimit, session, user, verification } from "../src/db/schema";

describe("Better Auth 1.7.2 schema", () => {
  it("keeps the pinned core user/session/verification fields", () => {
    expect(Object.keys(getTableColumns(user)).sort()).toEqual([...BETTER_AUTH_CORE_FIELDS.user].sort());
    expect(Object.keys(getTableColumns(session)).sort()).toEqual([...BETTER_AUTH_CORE_FIELDS.session].sort());
    expect(Object.keys(getTableColumns(verification)).sort()).toEqual([...BETTER_AUTH_CORE_FIELDS.verification].sort());
  });

  it("includes the 1.7 account issuer identity key and rate-limit storage fields", () => {
    expect(Object.keys(getTableColumns(account)).sort()).toEqual([...BETTER_AUTH_CORE_FIELDS.account].sort());
    expect(Object.keys(getTableColumns(rateLimit)).sort()).toEqual([...BETTER_AUTH_CORE_FIELDS.rateLimit].sort());
  });
});
