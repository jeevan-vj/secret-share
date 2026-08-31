import { describe, expect, it } from "vitest";
import { AUTH_RATE_LIMIT_RULES, createAuthOptions } from "../src/lib/auth-options";
import { parseTrustedOrigins, useSecureAuthCookies } from "../src/lib/env";

describe("Better Auth production configuration", () => {
  const env = {
    BETTER_AUTH_SECRET: "test-secret-at-least-32-characters-long!!",
    BETTER_AUTH_URL: "https://secret.example",
    BETTER_AUTH_TRUSTED_ORIGINS: "https://secret.example,https://preview.example",
    ACCOUNTS_ENABLED: "true",
    MAIL_PROVIDER: "memory",
  };

  it("uses secure HTTP-only SameSite cookies and trusted origins", () => {
    const options = createAuthOptions(env);
    expect(useSecureAuthCookies(env)).toBe(true);
    expect(options.advanced?.useSecureCookies).toBe(true);
    expect(options.advanced?.defaultCookieAttributes).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      secure: true,
    });
    expect(options.trustedOrigins).toEqual(["https://secret.example", "https://preview.example"]);
    expect(parseTrustedOrigins(env)).toContain("https://secret.example");
  });

  it("requires email verification, password reset, and session revoke-on-reset", () => {
    const options = createAuthOptions(env);
    expect(options.emailAndPassword?.enabled).toBe(true);
    expect(options.emailAndPassword?.requireEmailVerification).toBe(true);
    expect(options.emailAndPassword?.revokeSessionsOnPasswordReset).toBe(true);
    expect(options.emailAndPassword?.sendResetPassword).toEqual(expect.any(Function));
    expect(options.emailVerification?.sendVerificationEmail).toEqual(expect.any(Function));
    expect(options.emailVerification?.sendOnSignUp).toBe(true);
  });

  it("enables rate limits on sign-up, sign-in, verification, and reset", () => {
    const options = createAuthOptions(env);
    expect(options.rateLimit?.enabled).toBe(true);
    expect(options.rateLimit?.customRules).toEqual(AUTH_RATE_LIMIT_RULES);
    expect(AUTH_RATE_LIMIT_RULES["/sign-in/email"].max).toBeLessThanOrEqual(10);
    expect(AUTH_RATE_LIMIT_RULES["/sign-up/email"].max).toBeLessThanOrEqual(10);
    expect(AUTH_RATE_LIMIT_RULES["/request-password-reset"].max).toBeLessThanOrEqual(5);
    expect(AUTH_RATE_LIMIT_RULES["/send-verification-email"].max).toBeLessThanOrEqual(5);
  });

  it("disables request logging and telemetry", () => {
    const options = createAuthOptions(env);
    expect(options.logger).toEqual({ disabled: true });
    expect(options.telemetry).toEqual({ enabled: false });
    expect(options.session?.cookieCache).toEqual({ enabled: false });
  });
});
