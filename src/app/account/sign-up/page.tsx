"use client";

import { FormEvent, useState } from "react";
import { Alert, Button } from "@/components/ui";
import { authClient } from "@/lib/auth-client";
import { accountCopy } from "@/lib/ui-copy";

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const result = await authClient.signUp.email({ name, email, password });
    setBusy(false);
    if (result.error) {
      setError(accountCopy.genericAuthError);
      return;
    }
    window.location.href = "/account/verify";
  }

  return (
    <main id="content" className="shell">
      <section className="card">
        <p className="eyebrow">{accountCopy.eyebrow}</p>
        <h1>{accountCopy.signUpTitle}</h1>
        <form onSubmit={submit}>
          <label htmlFor="name">{accountCopy.name}</label>
          <input id="name" type="text" autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} />
          <label htmlFor="email">{accountCopy.email}</label>
          <input id="email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <label htmlFor="password">{accountCopy.password}</label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={10}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" disabled={busy} aria-busy={busy}>
            {accountCopy.submitSignUp}
          </Button>
        </form>
        {error ? <Alert tone="danger">{error}</Alert> : null}
        <p className="muted">
          <a href="/account/sign-in">{accountCopy.haveAccount}</a>
        </p>
      </section>
    </main>
  );
}
