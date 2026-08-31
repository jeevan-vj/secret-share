"use client";

import { useEffect, useState } from "react";
import { AuthShell } from "@/components/auth-shell";
import { Alert, Button } from "@/components/ui";
import { authClient } from "@/lib/auth-client";
import { accountCopy, chromeCopy } from "@/lib/ui-copy";

type MeUser = { id: string; email: string; emailVerified: boolean; name: string };
type ShareRow = { id: string; createdAt: string; expiresAt: string; status: "available" | "consumed" | "expired" | "revoked" };

const statusLabel: Record<ShareRow["status"], string> = {
  available: accountCopy.statusAvailable,
  consumed: accountCopy.statusConsumed,
  expired: accountCopy.statusExpired,
  revoked: accountCopy.statusRevoked,
};

async function signOut() {
  await authClient.signOut();
  window.location.assign("/");
}

export default function AccountPage() {
  const [accountsEnabled, setAccountsEnabled] = useState<boolean | null>(null);
  const [user, setUser] = useState<MeUser | null>(null);
  const [items, setItems] = useState<ShareRow[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadMe() {
    const response = await fetch("/api/me", { cache: "no-store" });
    if (!response.ok) throw new Error("me_failed");
    return (await response.json()) as { accountsEnabled: boolean; user: MeUser | null };
  }

  async function loadShares(cursor?: string | null, append = false) {
    const url = new URL("/api/me/secrets", window.location.origin);
    url.searchParams.set("limit", "20");
    if (cursor) url.searchParams.set("cursor", cursor);
    const response = await fetch(url.toString(), { cache: "no-store" });
    if (response.status === 401) {
      window.location.assign("/sign-in");
      return;
    }
    if (!response.ok) throw new Error("list_failed");
    const body = (await response.json()) as { items: ShareRow[]; nextCursor: string | null };
    setItems((current) => (append ? [...current, ...body.items] : body.items));
    setNextCursor(body.nextCursor);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await loadMe();
        if (cancelled) return;
        setAccountsEnabled(me.accountsEnabled);
        setUser(me.user);
        if (!me.accountsEnabled) return;
        if (!me.user) {
          window.location.assign("/sign-in");
          return;
        }
        if (me.user.emailVerified) await loadShares();
      } catch {
        if (!cancelled) setError(accountCopy.genericAuthError);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function revoke(id: string) {
    setBusyId(id);
    setError(null);
    const response = await fetch(`/api/me/secrets/${encodeURIComponent(id)}/revoke`, { method: "POST" });
    setBusyId(null);
    if (response.ok) {
      setItems((current) => current.map((row) => (row.id === id ? { ...row, status: "revoked" } : row)));
      return;
    }
    setError(response.status === 429 ? accountCopy.rateLimited : accountCopy.genericAuthError);
  }

  async function revokeOtherSessions() {
    setError(null);
    const { error: authError } = await authClient.revokeOtherSessions();
    if (authError) setError(accountCopy.genericAuthError);
  }

  async function resendVerification() {
    if (!user) return;
    setError(null);
    const { error: authError } = await authClient.sendVerificationEmail({
      email: user.email,
      callbackURL: "/account",
    });
    if (authError) setError(authError.status === 429 ? accountCopy.rateLimited : accountCopy.genericAuthError);
  }

  return (
    <AuthShell>
      <p className="eyebrow">{accountCopy.eyebrow}</p>
      <h1>{accountCopy.title}</h1>
      <AccountBody
        accountsEnabled={accountsEnabled}
        loading={loading}
        user={user}
        items={items}
        nextCursor={nextCursor}
        busyId={busyId}
        error={error}
        onRevoke={revoke}
        onLoadMore={() => loadShares(nextCursor, true)}
        onResendVerification={resendVerification}
        onRevokeOtherSessions={revokeOtherSessions}
      />
    </AuthShell>
  );
}

function AccountBody({
  accountsEnabled,
  loading,
  user,
  items,
  nextCursor,
  busyId,
  error,
  onRevoke,
  onLoadMore,
  onResendVerification,
  onRevokeOtherSessions,
}: {
  accountsEnabled: boolean | null;
  loading: boolean;
  user: MeUser | null;
  items: ShareRow[];
  nextCursor: string | null;
  busyId: string | null;
  error: string | null;
  onRevoke: (id: string) => void;
  onLoadMore: () => void;
  onResendVerification: () => void;
  onRevokeOtherSessions: () => void;
}) {
  if (accountsEnabled === false) {
    return <Alert tone="info">{accountCopy.disabled}</Alert>;
  }
  if (loading) {
    return <p className="muted">{accountCopy.loading}</p>;
  }
  return (
    <>
      <p className="lead">{accountCopy.lead}</p>
      {user && !user.emailVerified ? (
        <>
          <Alert tone="warn" title={accountCopy.verifyTitle}>
            {accountCopy.verifyBody}
          </Alert>
          <div className="button-row">
            <Button type="button" onClick={onResendVerification}>
              {accountCopy.resendVerification}
            </Button>
          </div>
        </>
      ) : null}
      {user?.emailVerified ? (
        <OwnedShareList items={items} nextCursor={nextCursor} busyId={busyId} onRevoke={onRevoke} onLoadMore={onLoadMore} />
      ) : null}
      <section className="stack">
        <h2>{accountCopy.sessionsTitle}</h2>
        <p className="muted">{accountCopy.sessionsBody}</p>
        <div className="button-row">
          <Button type="button" variant="secondary" onClick={onRevokeOtherSessions}>
            {accountCopy.revokeOtherSessions}
          </Button>
          <Button type="button" variant="secondary" onClick={signOut}>
            {chromeCopy.signOut}
          </Button>
        </div>
      </section>
      {error ? <Alert tone="danger">{error}</Alert> : null}
    </>
  );
}

function OwnedShareList({
  items,
  nextCursor,
  busyId,
  onRevoke,
  onLoadMore,
}: {
  items: ShareRow[];
  nextCursor: string | null;
  busyId: string | null;
  onRevoke: (id: string) => void;
  onLoadMore: () => void;
}) {
  return (
    <div className="share-table-wrap">
      {items.length === 0 ? (
        <p className="muted">{accountCopy.empty}</p>
      ) : (
        <table className="share-table">
          <thead>
            <tr>
              <th scope="col">ID</th>
              <th scope="col">{accountCopy.created}</th>
              <th scope="col">{accountCopy.expires}</th>
              <th scope="col">Status</th>
              <th scope="col">
                <span className="visually-hidden">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr key={row.id}>
                <td>
                  <code>{row.id}</code>
                </td>
                <td>{formatStamp(row.createdAt)}</td>
                <td>{formatStamp(row.expiresAt)}</td>
                <td>{statusLabel[row.status]}</td>
                <td>
                  <ShareRowAction row={row} busyId={busyId} onRevoke={onRevoke} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {nextCursor ? (
        <Button type="button" variant="secondary" onClick={onLoadMore}>
          {accountCopy.loadMore}
        </Button>
      ) : null}
    </div>
  );
}

function ShareRowAction({
  row,
  busyId,
  onRevoke,
}: {
  row: ShareRow;
  busyId: string | null;
  onRevoke: (id: string) => void;
}) {
  if (row.status === "available") {
    return (
      <Button type="button" variant="secondary" disabled={busyId === row.id} onClick={() => onRevoke(row.id)}>
        {busyId === row.id ? accountCopy.revoking : accountCopy.revoke}
      </Button>
    );
  }
  if (row.status === "revoked") {
    return accountCopy.revoked;
  }
  return null;
}

function formatStamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString().replace("T", " ").replace(/\.\d{3}Z$/, " UTC");
}
