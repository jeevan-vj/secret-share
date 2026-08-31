"use client";

import { useAccountsEnabled } from "@/components/accounts-provider";
import { authClient } from "@/lib/auth-client";
import { accountCopy, chromeCopy, dashboardCopy } from "@/lib/ui-copy";

export function AccountNav() {
  const session = authClient.useSession();
  if (session.isPending) return <nav className="account-nav" aria-label="Account" />;

  if (session.data?.user) {
    return (
      <nav className="account-nav" aria-label="Account">
        <a href="/dashboard">{chromeCopy.dashboard}</a>
        <a href="/account">{chromeCopy.account}</a>
        <button
          type="button"
          className="link-button"
          onClick={() => {
            void authClient.signOut({
              fetchOptions: {
                onSuccess: () => {
                  window.location.href = "/";
                },
              },
            });
          }}
        >
          {chromeCopy.signOut}
        </button>
      </nav>
    );
  }

  return (
    <nav className="account-nav" aria-label="Account">
      <a href="/sign-in">{chromeCopy.signIn}</a>
      <a href="/sign-up">{chromeCopy.signUp}</a>
    </nav>
  );
}

export function SignedInHint() {
  const enabled = useAccountsEnabled();
  const session = authClient.useSession();
  if (!enabled || !session.data?.user) return null;
  return (
    <>
      <p className="muted">{accountCopy.signedInAs} {session.data.user.email}</p>
      <p className="muted">{dashboardCopy.createHint}</p>
    </>
  );
}
