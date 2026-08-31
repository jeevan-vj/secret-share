"use client";

import { useEffect, useState } from "react";
import { chromeCopy } from "@/lib/ui-copy";

type MeResponse = {
  accountsEnabled: boolean;
  user: { id: string; email: string; emailVerified: boolean; name: string } | null;
};

export function AccountNav() {
  const [me, setMe] = useState<MeResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/me", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as MeResponse;
      })
      .then((body) => {
        if (!cancelled) setMe(body);
      })
      .catch(() => {
        if (!cancelled) setMe({ accountsEnabled: false, user: null });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!me?.accountsEnabled) return null;

  return (
    <nav className="account-nav" aria-label="Account">
      {me.user ? (
        <a href="/account">{chromeCopy.account}</a>
      ) : (
        <>
          <a href="/sign-in">{chromeCopy.signIn}</a>
          <a href="/sign-up">{chromeCopy.signUp}</a>
        </>
      )}
    </nav>
  );
}
