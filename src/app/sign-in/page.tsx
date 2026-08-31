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
    if (result.error) {
      setError(accountCopy.genericError);
      setBusy(false);
      return;
    }
    window.location.href = "/dashboard";
  }

  return (
    <main id="content" className="shell">
      <section className="card">
        <p className="eyebrow">{accountCopy.signInEyebrow}</p>
        <h1>{accountCopy.signInTitle}</h1>
        <p className="lead">{accountCopy.signInLead}</p>
        <form onSubmit={submit}>
          <label htmlFor="email">{accountCopy.email}</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          <label htmlFor="password">{accountCopy.password}</label>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" minLength={12} />
          <Button type="submit" disabled={busy} aria-busy={busy}>
            {busy ? accountCopy.submitting : accountCopy.submitSignIn}
          </Button>
        </form>
        <p className="muted">
          <a href="/reset-password">{accountCopy.forgotPassword}</a>
          {" · "}
          <a href="/sign-up">{accountCopy.submitSignUp}</a>
        </p>
        {error ? <Alert tone="danger">{error}</Alert> : null}
      </section>
    </main>
  );
}
