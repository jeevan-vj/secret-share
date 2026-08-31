"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { chromeCopy } from "@/lib/ui-copy";

type AccountSession = {
  accountsEnabled: boolean;
  user: { email: string | null } | null;
};

export function AccountNav() {
  const [session, setSession] = useState<AccountSession | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/account/session", { cache: "no-store", credentials: "same-origin" })
      .then((response) => (response.ok ? response.json() : null))
      .then((body: AccountSession | null) => {
        if (!cancelled && body) setSession(body);
      })
      .catch(() => {
        if (!cancelled) setSession({ accountsEnabled: false, user: null });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!session?.accountsEnabled) return null;

  async function signOut() {
    await authClient.signOut();
    window.location.href = "/";
  }

  return (
    <nav className="account-nav" aria-label="Account">
      {session.user ? (
        <>
          <a href="/account">{chromeCopy.account}</a>
          <button type="button" className="text-link" onClick={signOut}>
            {chromeCopy.signOut}
          </button>
        </>
      ) : (
        <a href="/account/sign-in">{chromeCopy.signIn}</a>
      )}
    </nav>
  );
}
