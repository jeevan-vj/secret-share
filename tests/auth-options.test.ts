import { describe, expect, it, vi } from "vitest";
import { createAuthOptions } from "../src/lib/auth-options";

const options = createAuthOptions({
  secret: "test-secret-test-secret-test-secret-test",
  baseURL: "https://share.example",
  db: {} as never,
  accountsEnabled: true,
  trustedOrigins: ["https://share.example"],
  secureCookies: true,
  socialProviders: {
    google: { clientId: "google-client", clientSecret: "google-secret" },
    github: { clientId: "github-client", clientSecret: "github-secret" },
  },
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

  it("configures social sign-in without forced account linking and encrypts provider tokens", () => {
    expect(options.socialProviders).toEqual({
      google: { clientId: "google-client", clientSecret: "google-secret" },
      github: { clientId: "github-client", clientSecret: "github-secret" },
    });
    expect(options.account.encryptOAuthTokens).toBe(true);
    expect(options.account.accountLinking).toMatchObject({
      enabled: true,
      allowDifferentEmails: false,
      trustedProviders: [],
    });
    expect(options.rateLimit.customRules["/sign-in/social"]).toEqual({ window: 60, max: 10 });
  });

  it("disables email/password when accounts are not enabled", () => {
    const disabled = createAuthOptions({
      secret: "test-secret-test-secret-test-secret-test",
      baseURL: "https://share.example",
      db: {} as never,
      accountsEnabled: false,
      trustedOrigins: ["https://share.example"],
      secureCookies: true,
      socialProviders: {
        google: { clientId: "google-client", clientSecret: "google-secret" },
      },
      sendAuthEmail: vi.fn(async () => undefined),
    });
    expect(disabled.emailAndPassword.enabled).toBe(false);
    expect(disabled.socialProviders).toEqual({});
  });

  it("keeps verification and reset email delivery on the request lifecycle", async () => {
    let release!: () => void;
    const sendAuthEmail = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          release = resolve;
        }),
    );
    const configured = createAuthOptions({
      secret: "test-secret-test-secret-test-secret-test",
      baseURL: "https://share.example",
      db: {} as never,
      accountsEnabled: true,
      trustedOrigins: ["https://share.example"],
      secureCookies: true,
      socialProviders: {},
      sendAuthEmail,
    });

    let finished = false;
    const pending = configured.emailAndPassword.sendResetPassword({
      user: { email: "owner@example.test" },
      url: "https://share.example/reset-password",
    });
    void pending.then(() => {
      finished = true;
    });
    await Promise.resolve();
    expect(finished).toBe(false);
    expect(sendAuthEmail).toHaveBeenCalledOnce();
    release();
    await pending;
    expect(finished).toBe(true);
  });
});
