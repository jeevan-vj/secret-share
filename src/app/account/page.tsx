"use client";

import { useState } from "react";
import { Alert, Button } from "@/components/ui";
import { authClient } from "@/lib/auth-client";
import { accountCopy } from "@/lib/ui-copy";

export default function AccountPage() {
  const session = authClient.useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (session.isPending) {
    return (
      <main id="content" className="shell">
        <section className="card">
          <h1>{accountCopy.accountTitle}</h1>
        </section>
      </main>
    );
  }

  if (!session.data?.user) {
    return (
      <main id="content" className="shell">
        <section className="card">
          <h1>{accountCopy.accountTitle}</h1>
          <p className="lead">{accountCopy.signInLead}</p>
          <p><a href="/sign-in">{accountCopy.submitSignIn}</a></p>
        </section>
      </main>
    );
  }

  async function revokeOthers() {
    setBusy(true);
    setError(null);
    const result = await authClient.revokeOtherSessions();
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
        <h1>{accountCopy.accountTitle}</h1>
        <p className="lead">{accountCopy.accountLead}</p>
        <p className="muted">{accountCopy.signedInAs} {session.data.user.email}</p>
        <div className="button-row">
          <Button type="button" onClick={() => void revokeOthers()} disabled={busy} aria-busy={busy}>
            {accountCopy.revokeOtherSessions}
          </Button>
        </div>
        {done ? <Alert tone="success">{accountCopy.otherSessionsRevoked}</Alert> : null}
        {error ? <Alert tone="danger">{error}</Alert> : null}
      </section>
    </main>
  );
}
