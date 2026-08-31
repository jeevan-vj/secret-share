import { describe, expect, it, vi } from "vitest";
import { createAuthOptions } from "../src/lib/auth-options";

const options = createAuthOptions({
  secret: "test-secret-test-secret-test-secret-test",
  baseURL: "https://share.example",
  db: {} as never,
  accountsEnabled: true,
  trustedOrigins: ["https://share.example"],
  secureCookies: true,
  sendAuthEmail: vi.fn(async () => undefined),
});

describe("Better Auth options", () => {
  it("uses HTTP-only SameSite=Lax Secure cookies and trusted origins", () => {
    expect(options.trustedOrigins).toEqual(["https://share.example"]);
    expect(options.advanced.useSecureCookies).toBe(true);
    expect(options.advanced.defaultCookieAttributes).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
    });
    expect(options.advanced.disableCSRFCheck).toBe(false);
  });

  it("stores auth rate limits in the database and tightens auth endpoints", () => {
    expect(options.rateLimit.storage).toBe("database");
    expect(options.rateLimit.enabled).toBe(true);
    expect(options.rateLimit.customRules["/sign-in/email"]).toEqual({ window: 60, max: 5 });
    expect(options.rateLimit.customRules["/sign-up/email"]).toEqual({ window: 60, max: 5 });
    expect(options.rateLimit.customRules["/request-password-reset"]).toEqual({ window: 60, max: 3 });
    expect(options.rateLimit.customRules["/send-verification-email"]).toEqual({ window: 60, max: 3 });
  });

  it("requires verification, disables cookie cache, and does not log", () => {
    expect(options.emailAndPassword.requireEmailVerification).toBe(true);
    expect(options.emailAndPassword.autoSignIn).toBe(false);
    expect(options.emailAndPassword.revokeSessionsOnPasswordReset).toBe(true);
    expect(options.session.cookieCache.enabled).toBe(false);
    expect(options.logger).toEqual({ disabled: true });
    expect(options.telemetry).toEqual({ enabled: false });
  });

  it("disables email/password when accounts are not enabled", () => {
    const disabled = createAuthOptions({
      secret: "test-secret-test-secret-test-secret-test",
      baseURL: "https://share.example",
      db: {} as never,
      accountsEnabled: false,
      trustedOrigins: ["https://share.example"],
      secureCookies: true,
      sendAuthEmail: vi.fn(async () => undefined),
    });
    expect(disabled.emailAndPassword.enabled).toBe(false);
  });
});
