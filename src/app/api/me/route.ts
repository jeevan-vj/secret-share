import { noStoreJson } from "@/lib/accounts-config";
import { SessionLookupError, resolveSessionUser } from "@/lib/request-session";
import { getSocialProviders, isAccountsEnabled } from "@/lib/runtime-env";

export async function GET(request: Request) {
  if (!isAccountsEnabled()) {
    return noStoreJson({ accountsEnabled: false, socialProviders: [], user: null });
  }

  const socialProviders = getSocialProviders().publicProviders;

  try {
    const user = await resolveSessionUser(request);
    return noStoreJson({
      accountsEnabled: true,
      socialProviders,
      user: user ? { id: user.id, email: user.email, emailVerified: user.emailVerified, name: user.name } : null,
    });
  } catch (error) {
    if (error instanceof SessionLookupError) {
      return noStoreJson({ error: "service_unavailable" }, 503);
    }
    throw error;
  }
}
