import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import type { AppDatabase } from "@/db/create-db";
import { authSchema } from "@/db/schema";
import {
  isAccountsEnabled,
  parseTrustedOrigins,
  useSecureAuthCookies,
  type AccountsEnv,
} from "@/lib/accounts";
import { createMailerFromEnv, type AuthMailer } from "@/lib/mail";
import { revokeAvailableOwnedSecrets } from "@/services/secrets";

export type AuthRuntime = AccountsEnv & {
  DB?: D1Database;
};

export function buildAuthOptions(input: {
  env: AuthRuntime;
  db: AppDatabase;
  sendMail?: AuthMailer | null;
}) {
  const secureCookies = useSecureAuthCookies(input.env);
  const trustedOrigins = parseTrustedOrigins(input.env);
  const sendMail = input.sendMail === undefined ? createMailerFromEnv(input.env) : input.sendMail;

  return {
    appName: "Secret Share",
    secret: input.env.BETTER_AUTH_SECRET,
    baseURL: input.env.BETTER_AUTH_URL,
    trustedOrigins,
    database: drizzleAdapter(input.db, {
      provider: "sqlite" as const,
      schema: authSchema,
    }),
    telemetry: { enabled: false },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      minPasswordLength: 10,
      maxPasswordLength: 128,
      autoSignIn: false,
      sendResetPassword: async ({ user, url }: { user: { email: string }; url: string }) => {
        if (!sendMail) throw new Error("mail_unconfigured");
        await sendMail({ to: user.email, kind: "reset", url });
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: false,
      sendVerificationEmail: async ({ user, url }: { user: { email: string }; url: string }) => {
        if (!sendMail) throw new Error("mail_unconfigured");
        await sendMail({ to: user.email, kind: "verify", url });
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
      cookieCache: { enabled: false },
    },
    user: {
      deleteUser: { enabled: true },
    },
    rateLimit: {
      enabled: true,
      window: 60,
      max: 20,
      storage: "database" as const,
      customRules: {
        "/sign-in/email": { window: 60, max: 5 },
        "/sign-up/email": { window: 60, max: 5 },
        "/forget-password": { window: 60, max: 3 },
        "/request-password-reset": { window: 60, max: 3 },
        "/send-verification-email": { window: 60, max: 3 },
        "/reset-password": { window: 60, max: 5 },
      },
    },
    advanced: {
      useSecureCookies: secureCookies,
      disableCSRFCheck: false,
      disableOriginCheck: false,
      ipAddress: {
        ipAddressHeaders: ["cf-connecting-ip"],
      },
      defaultCookieAttributes: {
        httpOnly: true,
        sameSite: "lax" as const,
        secure: secureCookies,
        path: "/",
      },
    },
    databaseHooks: {
      user: {
        delete: {
          async before(record: { id: string }) {
            await revokeAvailableOwnedSecrets(input.db, record.id);
          },
        },
      },
    },
  };
}

export function createAuth(input: {
  env: AuthRuntime;
  db: AppDatabase;
  sendMail?: AuthMailer | null;
}) {
  return betterAuth(buildAuthOptions(input));
}

export function accountsDisabledResponse() {
  return Response.json({ error: "not_found" }, { status: 404, headers: { "Cache-Control": "no-store" } });
}

export { isAccountsEnabled };
