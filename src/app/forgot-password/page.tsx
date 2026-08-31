"use client";

import { FormEvent, useState } from "react";
import { AuthShell } from "@/components/auth-shell";
import { Alert, Button } from "@/components/ui";
import { authClient } from "@/lib/auth-client";
import { accountCopy, authCopy } from "@/lib/ui-copy";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    await authClient.requestPasswordReset({
      email,
      redirectTo: "/reset-password",
    });
    setBusy(false);
    setSent(true);
  }

  return (
    <AuthShell>
        <p className="eyebrow">{accountCopy.eyebrow}</p>
        <h1>{authCopy.forgotTitle}</h1>
        <p className="lead">{authCopy.forgotLead}</p>
        {sent ? (
          <Alert tone="info">{authCopy.forgotSent}</Alert>
        ) : (
          <form onSubmit={submit}>
            <label htmlFor="email">{authCopy.email}</label>
            <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            <Button type="submit" disabled={busy} aria-busy={busy}>
              {busy ? authCopy.submitting : authCopy.forgotSubmit}
            </Button>
          </form>
        )}
    </AuthShell>
  );
}
