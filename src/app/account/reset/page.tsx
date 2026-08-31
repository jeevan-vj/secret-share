"use client";

import { FormEvent, useState } from "react";
import { Alert, Button } from "@/components/ui";
import { authClient } from "@/lib/auth-client";
import { accountCopy } from "@/lib/ui-copy";

export default function ResetPage() {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const token = new URLSearchParams(window.location.search).get("token") ?? undefined;
    const result = await authClient.resetPassword({
      newPassword: password,
      token,
    });
    setBusy(false);
    if (result.error) {
      setError(accountCopy.genericAuthError);
      return;
    }
    window.location.href = "/account/sign-in";
  }

  return (
    <main id="content" className="shell">
      <section className="card">
        <p className="eyebrow">{accountCopy.eyebrow}</p>
        <h1>{accountCopy.resetTitle}</h1>
        <p className="lead">{accountCopy.resetLead}</p>
        <form onSubmit={submit}>
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
            {accountCopy.submitReset}
          </Button>
        </form>
        {error ? <Alert tone="danger">{error}</Alert> : null}
      </section>
    </main>
  );
}
