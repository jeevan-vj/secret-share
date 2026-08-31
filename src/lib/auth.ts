import { db } from "@/db/client";
import { createAuth } from "@/lib/auth-options";
import { sendResendEmail } from "@/lib/mailer";
import { getAppEnv, getMailerConfig, getSecureCookies, getTrustedOrigins, isAccountsEnabled } from "@/lib/runtime-env";
import { revokeAvailableSecretsForOwner } from "@/services/secret-queries";

const appEnv = getAppEnv();

export const auth = createAuth({
  secret: appEnv.BETTER_AUTH_SECRET,
  baseURL: appEnv.BETTER_AUTH_URL,
  db,
  accountsEnabled: isAccountsEnabled(),
  trustedOrigins: getTrustedOrigins(),
  secureCookies: getSecureCookies(),
  sendAuthEmail: async (email) => {
    const mailer = getMailerConfig();
    if (!mailer) throw new Error("mail_not_configured");
    await sendResendEmail(email, mailer);
  },
  revokeAvailableForUser: (userId) => revokeAvailableSecretsForOwner(db, userId),
});
