import type { BetterAuthOptions } from "better-auth";
import { parseTrustedOrigins, useSecureAuthCookies, type AppAuthEnv } from "@/lib/env";
import { sendAuthEmail } from "@/lib/mail";

export const AUTH_RATE_LIMIT_RULES = {
  "/sign-in/email": { window: 60, max: 5 },
  "/sign-up/email": { window: 60, max: 5 },
  "/request-password-reset": { window: 60, max: 3 },
  "/reset-password": { window: 60, max: 5 },
  "/send-verification-email": { window: 60, max: 3 },
} as const;

export function createAuthOptions(env: AppAuthEnv): Omit<BetterAuthOptions, "database"> {
  const secure = useSecureAuthCookies(env);
  return {
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    trustedOrigins: parseTrustedOrigins(env),
    telemetry: { enabled: false },
    logger: { disabled: true },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      minPasswordLength: 12,
      autoSignIn: false,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, url }) => {
        await sendAuthEmail(env, { to: user.email, purpose: "reset", actionUrl: url });
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      sendOnSignIn: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => {
        await sendAuthEmail(env, { to: user.email, purpose: "verify", actionUrl: url });
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
      cookieCache: { enabled: false },
    },
    rateLimit: {
      enabled: true,
      window: 60,
      max: 10,
      customRules: AUTH_RATE_LIMIT_RULES,
    },
    advanced: {
      useSecureCookies: secure,
      defaultCookieAttributes: {
        httpOnly: true,
        sameSite: "lax",
        secure,
        path: "/",
      },
    },
  };
}
