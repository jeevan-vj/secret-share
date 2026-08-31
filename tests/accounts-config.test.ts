import { describe, expect, it } from "vitest";
import {
  hasCookieHeader,
  isTrustedMutationRequest,
  parseAccountsEnabled,
  parseSocialProviders,
  parseTrustedOrigins,
  usesSecureCookies,
} from "../src/lib/accounts-config";

describe("accounts config", () => {
  it("enables accounts only for the exact true flag", () => {
    expect(parseAccountsEnabled("true")).toBe(true);
    expect(parseAccountsEnabled("TRUE")).toBe(false);
    expect(parseAccountsEnabled(undefined)).toBe(false);
  });

  it("derives trusted origins from the auth base URL", () => {
    expect(parseTrustedOrigins("https://share.example", "https://preview.example, not-a-url")).toEqual([
      "https://share.example",
      "https://preview.example",
    ]);
    expect(usesSecureCookies("https://share.example")).toBe(true);
    expect(usesSecureCookies("http://localhost:3000")).toBe(false);
  });

  it("enables social providers only when each credential pair is complete", () => {
    expect(
      parseSocialProviders({
        GOOGLE_CLIENT_ID: "google-client",
        GOOGLE_CLIENT_SECRET: "google-secret",
        GITHUB_CLIENT_ID: "github-client",
      }),
    ).toEqual({
      config: { google: { clientId: "google-client", clientSecret: "google-secret" } },
      publicProviders: ["google"],
    });
    expect(parseSocialProviders({ GITHUB_CLIENT_SECRET: "github-secret" })).toEqual({
      config: {},
      publicProviders: [],
    });
  });

  it("requires a trusted Origin when cookies are present", () => {
    const trusted = ["https://share.example"];
    const withCookies = new Request("https://share.example/api/me/secrets/abc/revoke", {
      method: "POST",
      headers: { cookie: "better-auth.session_token=abc", origin: "https://evil.example" },
    });
    expect(hasCookieHeader(withCookies)).toBe(true);
    expect(isTrustedMutationRequest(withCookies, trusted)).toBe(false);
    expect(
      isTrustedMutationRequest(
        new Request("https://share.example/api/secrets", {
          method: "POST",
          headers: { cookie: "better-auth.session_token=abc", origin: "https://share.example" },
        }),
        trusted,
      ),
    ).toBe(true);
    expect(
      isTrustedMutationRequest(new Request("https://share.example/api/secrets", { method: "POST" }), trusted),
    ).toBe(true);
  });
});
