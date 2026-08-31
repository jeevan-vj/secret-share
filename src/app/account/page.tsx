"use client";

import { useEffect, useState } from "react";
import { Alert, Button } from "@/components/ui";
import { authClient } from "@/lib/auth-client";
import { accountCopy } from "@/lib/ui-copy";
import type { OwnerShare, ShareStatus } from "@/lib/share-status";

type ListResponse = {
  items: OwnerShare[];
  nextCursor: string | null;
};

const statusLabel: Record<ShareStatus, string> = {
  available: accountCopy.statusAvailable,
  consumed: accountCopy.statusConsumed,
  expired: accountCopy.statusExpired,
  revoked: accountCopy.statusRevoked,
};

export default function AccountPage() {
  const [items, setItems] = useState<OwnerShare[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  async function load(cursor?: string | null, replace = false) {
    setBusy(true);
    setError(null);
    const query = new URLSearchParams({ limit: "20" });
    if (cursor) query.set("cursor", cursor);
    const response = await fetch(`/api/account/secrets?${query}`, {
      cache: "no-store",
      credentials: "same-origin",
    });
    if (response.status === 404) {
      setError(accountCopy.unavailable);
      setBusy(false);
      return;
    }
    if (response.status === 401) {
      window.location.href = "/account/sign-in";
      return;
    }
    if (!response.ok) {
      setError(accountCopy.error);
      setBusy(false);
      return;
    }
    const body = (await response.json()) as ListResponse;
    setItems((current) => (replace ? body.items : [...current, ...body.items]));
    setNextCursor(body.nextCursor);
    setBusy(false);
  }

  useEffect(() => {
    void load(null, true);
  }, []);

  async function revoke(id: string) {
    setRevokingId(id);
    setError(null);
    const response = await fetch(`/api/account/secrets/${encodeURIComponent(id)}/revoke`, {
      method: "POST",
      credentials: "same-origin",
    });
    setRevokingId(null);
    if (!response.ok) {
      setError(accountCopy.revokeError);
      return;
    }
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, status: "revoked" } : item)),
    );
  }

  async function revokeOtherSessions() {
    await authClient.revokeOtherSessions();
  }

  return (
    <main id="content" className="shell">
      <section className="card">
        <p className="eyebrow">{accountCopy.eyebrow}</p>
        <h1>{accountCopy.title}</h1>
        <p className="lead">{accountCopy.lead}</p>
        {error ? <Alert tone="danger">{error}</Alert> : null}
        {items.length === 0 && !busy && !error ? <p className="muted">{accountCopy.empty}</p> : null}
        {items.length > 0 ? (
          <div className="table-wrap">
            <table className="meta-table">
              <thead>
                <tr>
                  <th>{accountCopy.created}</th>
                  <th>{accountCopy.expires}</th>
                  <th>{accountCopy.status}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>{new Date(item.createdAt).toLocaleString()}</td>
                    <td>{new Date(item.expiresAt).toLocaleString()}</td>
                    <td>
                      <span className={`status-pill status-${item.status}`}>{statusLabel[item.status]}</span>
                    </td>
                    <td>
                      {item.status === "available" ? (
                        <Button
                          type="button"
                          variant="secondary"
                          disabled={revokingId === item.id}
                          onClick={() => revoke(item.id)}
                        >
                          {revokingId === item.id ? accountCopy.revoking : accountCopy.revoke}
                        </Button>
                      ) : item.status === "revoked" ? (
                        <span className="muted">{accountCopy.revoked}</span>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
        {nextCursor ? (
          <div className="stack">
            <Button type="button" variant="secondary" disabled={busy} onClick={() => load(nextCursor)}>
              {accountCopy.loadMore}
            </Button>
          </div>
        ) : null}
        <div className="sessions-panel">
          <h2>{accountCopy.sessionsTitle}</h2>
          <p className="muted">{accountCopy.sessionsLead}</p>
          <Button type="button" variant="secondary" onClick={revokeOtherSessions}>
            {accountCopy.revokeOthers}
          </Button>
        </div>
      </section>
    </main>
  );
}
