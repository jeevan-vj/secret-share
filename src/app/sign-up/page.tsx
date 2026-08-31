"use client";

import { FormEvent, useState } from "react";
import { AuthShell } from "@/components/auth-shell";
import { Alert, Button } from "@/components/ui";
import { AUTH_MIN_PASSWORD_LENGTH } from "@/lib/accounts-config";
import { authClient } from "@/lib/auth-client";
import { accountCopy, authCopy } from "@/lib/ui-copy";

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const { error: authError } = await authClient.signUp.email({
      name,
      email,
      password,
      callbackURL: "/account",
    });
    setBusy(false);
    if (authError) {
      setError(authError.status === 429 ? accountCopy.rateLimited : accountCopy.genericAuthError);
      return;
    }
    setSent(true);
  }

  return (
    <AuthShell>
        <p className="eyebrow">{accountCopy.eyebrow}</p>
        <h1>{authCopy.signUpTitle}</h1>
        <p className="lead">{authCopy.signUpLead}</p>
        {sent ? (
          <Alert tone="info">{authCopy.checkEmail}</Alert>
        ) : (
          <form onSubmit={submit}>
            <label htmlFor="name">{authCopy.name}</label>
            <input id="name" type="text" autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} />
            <label htmlFor="email">{authCopy.email}</label>
            <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            <label htmlFor="password">{authCopy.password}</label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={AUTH_MIN_PASSWORD_LENGTH}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <p className="hint">{authCopy.passwordHint}</p>
            <Button type="submit" disabled={busy} aria-busy={busy}>
              {busy ? authCopy.submitting : authCopy.submitSignUp}
            </Button>
          </form>
        )}
        <p className="muted">
          <a href="/sign-in">{authCopy.haveAccount}</a>
        </p>
        {error ? <Alert tone="danger">{error}</Alert> : null}
    </AuthShell>
  );
}
