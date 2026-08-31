import { describe, expect, it } from "vitest";
import {
  decodeOwnerCursor,
  encodeOwnerCursor,
  isAccountsEnabled,
  parseOwnerPageSize,
  parseTrustedOrigins,
  useSecureAuthCookies,
} from "../src/lib/accounts";

describe("accounts feature flag", () => {
  it("is disabled unless explicitly true", () => {
    expect(isAccountsEnabled({})).toBe(false);
    expect(isAccountsEnabled({ ACCOUNTS_ENABLED: "false" })).toBe(false);
    expect(isAccountsEnabled({ ACCOUNTS_ENABLED: "true" })).toBe(true);
  });

  it("parses trusted origins from the base URL and extras", () => {
    expect(
      parseTrustedOrigins({
        BETTER_AUTH_URL: "https://secret.example",
        AUTH_TRUSTED_ORIGINS: "https://preview.example, https://secret.example",
      }),
    ).toEqual(["https://secret.example", "https://preview.example"]);
  });

  it("uses secure cookies for https base URLs", () => {
    expect(useSecureAuthCookies({ BETTER_AUTH_URL: "https://secret.example" })).toBe(true);
    expect(useSecureAuthCookies({ BETTER_AUTH_URL: "http://localhost:3000" })).toBe(false);
    expect(useSecureAuthCookies({})).toBe(true);
  });

  it("bounds pagination and round-trips cursors", () => {
    expect(parseOwnerPageSize(null)).toBe(20);
    expect(parseOwnerPageSize("999")).toBe(50);
    const cursor = encodeOwnerCursor({ createdAt: "2026-08-31T00:00:00.000Z", id: "abc" });
    expect(decodeOwnerCursor(cursor)).toEqual({ createdAt: "2026-08-31T00:00:00.000Z", id: "abc" });
    expect(decodeOwnerCursor("not-a-cursor")).toBeNull();
  });
});
