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
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const result = await authClient.signUp.email({
      name,
      email,
      password,
      callbackURL: "/dashboard",
    });
    if (result.error) {
      setError(accountCopy.genericError);
      setBusy(false);
      return;
    }
    setPending(true);
    setBusy(false);
  }

  return (
    <main id="content" className="shell">
      <section className="card">
        <p className="eyebrow">{accountCopy.signInEyebrow}</p>
        <h1>{accountCopy.signUpTitle}</h1>
        <p className="lead">{accountCopy.signUpLead}</p>
        {pending ? (
          <Alert tone="info">{accountCopy.verifyPending}</Alert>
        ) : (
          <form onSubmit={submit}>
            <label htmlFor="name">{accountCopy.name}</label>
            <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
            <label htmlFor="email">{accountCopy.email}</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            <label htmlFor="password">{accountCopy.password}</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" minLength={12} />
            <Button type="submit" disabled={busy} aria-busy={busy}>
              {busy ? accountCopy.submitting : accountCopy.submitSignUp}
            </Button>
          </form>
        )}
        {error ? <Alert tone="danger">{error}</Alert> : null}
      </section>
    </main>
  );
}
