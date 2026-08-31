"use client";

import { FormEvent, useMemo, useState } from "react";
import { Alert, Button } from "@/components/ui";
import { authClient } from "@/lib/auth-client";
import { accountCopy } from "@/lib/ui-copy";

export default function ResetPasswordPage() {
  const token = useMemo(() => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("token");
  }, []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function requestReset(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const result = await authClient.requestPasswordReset({
      email,
      redirectTo: "/reset-password",
    });
    if (result.error) {
      setError(accountCopy.genericError);
      setBusy(false);
      return;
    }
    setDone(true);
    setBusy(false);
  }

  async function confirmReset(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    setBusy(true);
    setError(null);
    const result = await authClient.resetPassword({ newPassword: password, token });
    if (result.error) {
      setError(accountCopy.genericError);
      setBusy(false);
      return;
    }
    setDone(true);
    setBusy(false);
  }

  return (
    <main id="content" className="shell">
      <section className="card">
        <p className="eyebrow">{accountCopy.signInEyebrow}</p>
        <h1>{accountCopy.resetTitle}</h1>
        <p className="lead">{accountCopy.resetLead}</p>
        {done ? (
          <Alert tone="success">{token ? accountCopy.resetDone : accountCopy.resetSent}</Alert>
        ) : token ? (
          <form onSubmit={confirmReset}>
            <label htmlFor="password">{accountCopy.newPassword}</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" minLength={12} />
            <Button type="submit" disabled={busy} aria-busy={busy}>
              {busy ? accountCopy.submitting : accountCopy.confirmReset}
            </Button>
          </form>
        ) : (
          <form onSubmit={requestReset}>
            <label htmlFor="email">{accountCopy.email}</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            <Button type="submit" disabled={busy} aria-busy={busy}>
              {busy ? accountCopy.submitting : accountCopy.resetSubmit}
            </Button>
          </form>
        )}
        {error ? <Alert tone="danger">{error}</Alert> : null}
      </section>
    </main>
  );
}
