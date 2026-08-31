"use client";

import { FormEvent, useState } from "react";
import { Alert, Button } from "@/components/ui";
import { authClient } from "@/lib/auth-client";
import { accountCopy } from "@/lib/ui-copy";

export default function ForgotPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    await authClient.forgetPassword({
      email,
      redirectTo: "/account/reset",
    });
    setBusy(false);
    setDone(true);
  }

  return (
    <main id="content" className="shell">
      <section className="card">
        <p className="eyebrow">{accountCopy.eyebrow}</p>
        <h1>{accountCopy.forgotTitle}</h1>
        <p className="lead">{accountCopy.forgotLead}</p>
        <form onSubmit={submit}>
          <label htmlFor="email">{accountCopy.email}</label>
          <input id="email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button type="submit" disabled={busy || done} aria-busy={busy}>
            {accountCopy.submitForgot}
          </Button>
        </form>
        {done ? <Alert tone="info">{accountCopy.forgotLead}</Alert> : null}
      </section>
    </main>
  );
}
