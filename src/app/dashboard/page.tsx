"use client";

import { useEffect, useState } from "react";
import { Alert, Button } from "@/components/ui";
import { authClient } from "@/lib/auth-client";
import { dashboardCopy } from "@/lib/ui-copy";
import type { OwnerSecretView } from "@/lib/secret-status";

const statusLabel: Record<OwnerSecretView["status"], string> = {
  available: dashboardCopy.statusAvailable,
  consumed: dashboardCopy.statusConsumed,
  expired: dashboardCopy.statusExpired,
  revoked: dashboardCopy.statusRevoked,
};

export default function DashboardPage() {
  const session = authClient.useSession();
  const [items, setItems] = useState<OwnerSecretView[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);

  async function load(next?: string | null) {
    setBusy(true);
    setError(null);
    const params = new URLSearchParams({ limit: "20" });
    if (next) params.set("cursor", next);
    const response = await fetch(`/api/me/secrets?${params.toString()}`, { cache: "no-store" });
    if (response.status === 401) {
      window.location.href = "/sign-in";
      return;
    }
    if (!response.ok) {
      setError(dashboardCopy.empty);
      setBusy(false);
      return;
    }
    const body = (await response.json()) as { items: OwnerSecretView[]; nextCursor: string | null };
    setItems((current) => (next ? [...current, ...body.items] : body.items));
    setCursor(body.nextCursor);
    setBusy(false);
  }

  useEffect(() => {
    if (session.data?.user) void load();
  }, [session.data?.user?.id]);

  async function revoke(id: string) {
    setRevoking(id);
    const response = await fetch(`/api/me/secrets/${encodeURIComponent(id)}/revoke`, { method: "POST" });
    if (response.ok) {
      setItems((current) => current.map((item) => (item.id === id ? { ...item, status: "revoked" } : item)));
    }
    setRevoking(null);
  }

  if (session.isPending) {
    return (
      <main id="content" className="shell">
        <section className="card wide">
          <h1>{dashboardCopy.title}</h1>
        </section>
      </main>
    );
  }

  if (!session.data?.user) {
    return (
      <main id="content" className="shell">
        <section className="card">
          <h1>{dashboardCopy.title}</h1>
          <p className="lead">{dashboardCopy.lead}</p>
          <p><a href="/sign-in">Sign in</a></p>
        </section>
      </main>
    );
  }

  return (
    <main id="content" className="shell">
      <section className="card wide">
        <p className="eyebrow">{dashboardCopy.eyebrow}</p>
        <h1>{dashboardCopy.title}</h1>
        <p className="lead">{dashboardCopy.lead}</p>
        {items.length === 0 && !busy ? <p className="muted">{dashboardCopy.empty}</p> : null}
        {items.length > 0 ? (
          <div className="table-wrap">
            <table className="meta-table">
              <thead>
                <tr>
                  <th scope="col">ID</th>
                  <th scope="col">{dashboardCopy.created}</th>
                  <th scope="col">{dashboardCopy.expires}</th>
                  <th scope="col">{dashboardCopy.status}</th>
                  <th scope="col"><span className="visually-hidden">{dashboardCopy.revoke}</span></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td><code>{item.id}</code></td>
                    <td>{new Date(item.createdAt).toLocaleString()}</td>
                    <td>{new Date(item.expiresAt).toLocaleString()}</td>
                    <td><span className={`pill status-${item.status}`}>{statusLabel[item.status]}</span></td>
                    <td>
                      {item.status === "available" ? (
                        <Button
                          type="button"
                          variant="secondary"
                          disabled={revoking === item.id}
                          onClick={() => void revoke(item.id)}
                        >
                          {revoking === item.id ? dashboardCopy.revoking : dashboardCopy.revoke}
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
        {cursor ? (
          <div className="button-row">
            <Button type="button" variant="secondary" disabled={busy} onClick={() => void load(cursor)}>
              {dashboardCopy.loadMore}
            </Button>
          </div>
        ) : null}
        {error ? <Alert tone="danger">{error}</Alert> : null}
      </section>
    </main>
  );
}
