"use client";

import { FormEvent, useEffect, useState } from "react";
import { AuthShell } from "@/components/auth-shell";
import { Alert, Button } from "@/components/ui";
import { AUTH_MIN_PASSWORD_LENGTH } from "@/lib/accounts-config";
import type { SocialProvider } from "@/lib/accounts-config";
import { authClient } from "@/lib/auth-client";
import { accountCopy, authCopy } from "@/lib/ui-copy";

function messageForAuthError(status: number | undefined): string {
  if (status === 429) return accountCopy.rateLimited;
  if (status === 403) return accountCopy.verifyRequired;
  return accountCopy.genericAuthError;
}

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [busyProvider, setBusyProvider] = useState<SocialProvider | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [socialProviders, setSocialProviders] = useState<SocialProvider[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/me", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return [];
        const body = (await response.json()) as { socialProviders?: SocialProvider[] };
        return body.socialProviders ?? [];
      })
      .then((providers) => {
        if (!cancelled) setSocialProviders(providers);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const { error: authError } = await authClient.signIn.email({ email, password });
    setBusy(false);
    if (authError) {
      setError(messageForAuthError(authError.status));
      return;
    }
    window.location.assign("/account");
  }

  async function signInWith(provider: SocialProvider) {
    setBusyProvider(provider);
    setError(null);
    const { error: authError } = await authClient.signIn.social({
      provider,
      callbackURL: "/account",
      errorCallbackURL: "/sign-in",
    });
    if (authError) {
      setBusyProvider(null);
      setError(messageForAuthError(authError.status));
    }
  }

  return (
    <AuthShell>
        <p className="eyebrow">{accountCopy.eyebrow}</p>
        <h1>{authCopy.signInTitle}</h1>
        <p className="lead">{authCopy.signInLead}</p>
        {socialProviders.length > 0 ? (
          <section className="social-sign-in" aria-labelledby="social-sign-in-title">
            <p id="social-sign-in-title" className="muted">{authCopy.socialLead}</p>
            <div className="social-buttons">
              {socialProviders.map((provider) => (
                <Button
                  key={provider}
                  type="button"
                  variant="secondary"
                  disabled={busy || busyProvider !== null}
                  aria-busy={busyProvider === provider}
                  onClick={() => signInWith(provider)}
                >
                  {provider === "google" ? authCopy.socialGoogle : authCopy.socialGitHub}
                </Button>
              ))}
            </div>
            <p className="hint">{authCopy.socialPrivacy}</p>
            <div className="auth-divider" role="separator"><span>Email and password</span></div>
          </section>
        ) : null}
        <form onSubmit={submit}>
          <label htmlFor="email">{authCopy.email}</label>
          <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <label htmlFor="password">{authCopy.password}</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            minLength={AUTH_MIN_PASSWORD_LENGTH}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" disabled={busy || busyProvider !== null} aria-busy={busy}>
            {busy ? authCopy.submitting : authCopy.submitSignIn}
          </Button>
        </form>
        <p className="muted">
          <a href="/forgot-password">{authCopy.forgot}</a>
          {" · "}
          <a href="/sign-up">{authCopy.needAccount}</a>
        </p>
        {error ? <Alert tone="danger">{error}</Alert> : null}
    </AuthShell>
  );
}
