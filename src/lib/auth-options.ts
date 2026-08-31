import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { authSchema } from "@/db/schema";
import { AUTH_MIN_PASSWORD_LENGTH, type SocialProviderConfig } from "@/lib/accounts-config";
import type { AuthEmail } from "@/lib/mailer";

export type AuthDatabase = Parameters<typeof drizzleAdapter>[0];

export type AuthOptionInput = {
  secret: string | undefined;
  baseURL: string | undefined;
  db: AuthDatabase;
  accountsEnabled: boolean;
  trustedOrigins: string[];
  secureCookies: boolean;
  socialProviders: SocialProviderConfig;
  sendAuthEmail: (email: AuthEmail) => Promise<void>;
  revokeAvailableForUser?: (userId: string) => Promise<void>;
};

async function deliverAuthEmail(sendAuthEmail: (email: AuthEmail) => Promise<void>, email: AuthEmail): Promise<void> {
  try {
    await sendAuthEmail(email);
  } catch {
    // Delivery failures must not log recipients, URLs, or tokens.
  }
}

export function createAuthOptions(input: AuthOptionInput) {
  return {
    secret: input.secret,
    baseURL: input.baseURL,
    database: drizzleAdapter(input.db, {
      provider: "sqlite" as const,
      schema: authSchema,
    }),
    trustedOrigins: input.trustedOrigins,
    telemetry: { enabled: false },
    logger: { disabled: true },
    socialProviders: input.accountsEnabled ? input.socialProviders : {},
    account: {
      encryptOAuthTokens: true,
      accountLinking: {
        enabled: true,
        trustedProviders: [],
        allowDifferentEmails: false,
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
      cookieCache: { enabled: false },
    },
    user: {
      deleteUser: {
        enabled: true,
        beforeDelete: async (user: { id: string }) => {
          await input.revokeAvailableForUser?.(user.id);
        },
      },
    },
    emailAndPassword: {
      enabled: input.accountsEnabled,
      requireEmailVerification: true,
      autoSignIn: false,
      minPasswordLength: AUTH_MIN_PASSWORD_LENGTH,
      maxPasswordLength: 128,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, url }: { user: { email: string }; url: string }) => {
        await deliverAuthEmail(input.sendAuthEmail, {
          to: user.email,
          subject: "Reset your Secret Share password",
          text: `Use this link to choose a new password. It expires soon.\n\n${url}\n`,
        });
      },
      onExistingUserSignUp: async ({ user }: { user: { email: string } }) => {
        await deliverAuthEmail(input.sendAuthEmail, {
          to: user.email,
          subject: "A Secret Share sign-up was attempted with your email",
          text: "Someone tried to create a Secret Share account using this email. If this was you, sign in instead. If not, you can ignore this message.",
        });
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      sendOnSignIn: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }: { user: { email: string }; url: string }) => {
        await deliverAuthEmail(input.sendAuthEmail, {
          to: user.email,
          subject: "Verify your Secret Share email",
          text: `Confirm this email to finish creating your account.\n\n${url}\n`,
        });
      },
    },
    rateLimit: {
      enabled: true,
      window: 60,
      max: 30,
      storage: "database" as const,
      customRules: {
        "/sign-in/email": { window: 60, max: 5 },
        "/sign-in/social": { window: 60, max: 10 },
        "/sign-up/email": { window: 60, max: 5 },
        "/request-password-reset": { window: 60, max: 3 },
        "/forget-password": { window: 60, max: 3 },
        "/reset-password": { window: 60, max: 5 },
        "/send-verification-email": { window: 60, max: 3 },
        "/verify-email": { window: 60, max: 10 },
      },
    },
    advanced: {
      useSecureCookies: input.secureCookies,
      disableCSRFCheck: false,
      ipAddress: {
        ipAddressHeaders: ["cf-connecting-ip"],
      },
      defaultCookieAttributes: {
        httpOnly: true,
        sameSite: "lax" as const,
        secure: input.secureCookies,
        path: "/",
      },
    },
  };
}

export function createAuth(input: AuthOptionInput) {
  return betterAuth(createAuthOptions(input));
}
