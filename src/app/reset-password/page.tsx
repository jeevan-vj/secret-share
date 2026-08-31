"use client";

import { FormEvent, useEffect, useState } from "react";
import { AuthShell } from "@/components/auth-shell";
import { Alert, Button } from "@/components/ui";
import { AUTH_MIN_PASSWORD_LENGTH } from "@/lib/accounts-config";
import { authClient } from "@/lib/auth-client";
import { accountCopy, authCopy } from "@/lib/ui-copy";

export default function ResetPasswordPage() {
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get("token"));
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    setBusy(true);
    setError(null);
    const { error: authError } = await authClient.resetPassword({
      newPassword: password,
      token,
    });
    setBusy(false);
    if (authError) {
      setError(authError.status === 429 ? accountCopy.rateLimited : accountCopy.genericAuthError);
      return;
    }
    setDone(true);
  }

  return (
    <AuthShell>
      <p className="eyebrow">{accountCopy.eyebrow}</p>
      <h1>{authCopy.resetTitle}</h1>
      <ResetPasswordPanel
        token={token}
        done={done}
        busy={busy}
        password={password}
        onPasswordChange={setPassword}
        onSubmit={submit}
      />
      {error ? <Alert tone="danger">{error}</Alert> : null}
    </AuthShell>
  );
}

function ResetPasswordPanel({
  token,
  done,
  busy,
  password,
  onPasswordChange,
  onSubmit,
}: {
  token: string | null | undefined;
  done: boolean;
  busy: boolean;
  password: string;
  onPasswordChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
}) {
  if (token === undefined) {
    return <p className="muted">{accountCopy.loading}</p>;
  }
  if (!token) {
    return <Alert tone="danger">{authCopy.missingResetToken}</Alert>;
  }
  if (done) {
    return (
      <Alert tone="ok">
        {authCopy.resetDone} <a href="/sign-in">{authCopy.submitSignIn}</a>
      </Alert>
    );
  }
  return (
    <form onSubmit={onSubmit}>
      <label htmlFor="password">{authCopy.password}</label>
      <input
        id="password"
        type="password"
        autoComplete="new-password"
        required
        minLength={AUTH_MIN_PASSWORD_LENGTH}
        value={password}
        onChange={(event) => onPasswordChange(event.target.value)}
      />
      <p className="hint">{authCopy.passwordHint}</p>
      <Button type="submit" disabled={busy} aria-busy={busy}>
        {busy ? authCopy.submitting : authCopy.resetSubmit}
      </Button>
    </form>
  );
}
