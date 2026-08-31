"use client";

import { FormEvent, useState } from "react";
import { Alert, Button } from "@/components/ui";
import { authClient } from "@/lib/auth-client";
import { accountCopy } from "@/lib/ui-copy";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const result = await authClient.signIn.email({ email, password });
    setBusy(false);
    if (result.error) {
      setError(accountCopy.genericAuthError);
      return;
    }
    window.location.href = "/account";
  }

  return (
    <main id="content" className="shell">
      <section className="card">
        <p className="eyebrow">{accountCopy.eyebrow}</p>
        <h1>{accountCopy.signInTitle}</h1>
        <form onSubmit={submit}>
          <label htmlFor="email">{accountCopy.email}</label>
          <input id="email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <label htmlFor="password">{accountCopy.password}</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            minLength={10}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" disabled={busy} aria-busy={busy}>
            {accountCopy.submitSignIn}
          </Button>
        </form>
        {error ? <Alert tone="danger">{error}</Alert> : null}
        <p className="muted">
          <a href="/account/forgot">{accountCopy.forgotLink}</a>
          {" · "}
          <a href="/account/sign-up">{accountCopy.needAccount}</a>
        </p>
      </section>
    </main>
  );
}
