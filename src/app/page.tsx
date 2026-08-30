"use client";

import { FormEvent, useState } from "react";
import { Alert, Button, Pills } from "@/components/ui";
import { encryptSecret } from "@/lib/crypto";
import { getCreateView } from "@/lib/page-views";
import { buildShareLink } from "@/lib/share-link";
import { createCopy } from "@/lib/ui-copy";

export default function HomePage() {
  const [secret, setSecret] = useState("");
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const view = getCreateView({ secret, busy, shareLink, error });

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setCopied(false);
    try {
      const encrypted = await encryptSecret(secret);
      const response = await fetch("/api/secrets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ciphertext: encrypted.ciphertext,
          iv: encrypted.iv,
          algorithm: encrypted.algorithm,
          version: encrypted.version,
          deleteAfterView: true,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        }),
      });
      if (!response.ok) throw new Error("Unable to create secret");
      const { id } = (await response.json()) as { id: string };
      setShareLink(buildShareLink(window.location.origin, id, encrypted.key));
      setSecret("");
    } catch {
      setError(createCopy.error);
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  function createAnother() {
    setShareLink(null);
    setError(null);
    setCopied(false);
  }

  return (
    <main id="content" className="shell">
      <section className="card">
        {view.showResult ? (
          <>
            <p className="eyebrow">{createCopy.resultEyebrow}</p>
            <h1>{createCopy.resultTitle}</h1>
            <p className="lead">{createCopy.resultBody}</p>
            <div className="result">
              <label htmlFor="share-link">{createCopy.resultTitle}</label>
              <input
                id="share-link"
                type="text"
                readOnly
                value={shareLink ?? ""}
                onFocus={(e) => e.currentTarget.select()}
                spellCheck={false}
                autoComplete="off"
              />
              <div className="button-row">
                <Button type="button" onClick={copyLink}>
                  {copied ? createCopy.copied : createCopy.copyLink}
                </Button>
                <Button type="button" variant="secondary" onClick={createAnother}>
                  {createCopy.createAnother}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <p className="eyebrow">{createCopy.eyebrow}</p>
            <h1>{createCopy.title}</h1>
            <p className="lead">{createCopy.lead}</p>
            <p className="muted">{createCopy.oneTime}</p>
            <Pills items={[createCopy.expires, createCopy.viewOnce]} />
            <form onSubmit={submit}>
              <label htmlFor="secret">{createCopy.label}</label>
              <textarea
                id="secret"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                required
                minLength={1}
                maxLength={100000}
                autoComplete="off"
                spellCheck={false}
                aria-describedby="secret-hint"
                aria-invalid={view.status === "error"}
              />
              <p id="secret-hint" className="hint">
                {createCopy.hint}
              </p>
              <Button type="submit" disabled={view.submitDisabled} aria-busy={busy}>
                {view.submitLabel}
              </Button>
            </form>
            {error ? (
              <Alert tone="danger">{error}</Alert>
            ) : null}
          </>
        )}
      </section>
    </main>
  );
}
