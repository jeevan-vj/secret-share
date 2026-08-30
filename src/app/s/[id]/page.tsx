"use client";

import { useState } from "react";
import { Alert, Button } from "@/components/ui";
import { decryptSecret } from "@/lib/crypto";
import { getRevealView, type RevealStatus } from "@/lib/page-views";
import { readKeyFromFragment } from "@/lib/share-link";
import { revealCopy } from "@/lib/ui-copy";

export default function RevealPage({ params }: { params: Promise<{ id: string }> }) {
  const [plaintext, setPlaintext] = useState<string | null>(null);
  const [status, setStatus] = useState<RevealStatus>("idle");
  const [copied, setCopied] = useState(false);
  const view = getRevealView(status);

  async function reveal() {
    setCopied(false);
    setStatus("revealing");
    const { id } = await params;
    const key = readKeyFromFragment(window.location.hash);
    if (!key) {
      setStatus("missing_key");
      return;
    }

    const response = await fetch(`/api/secrets/${encodeURIComponent(id)}/claim`, { method: "POST", cache: "no-store" });
    if (!response.ok) {
      setStatus("unavailable");
      return;
    }

    const body = (await response.json()) as { ciphertext: string; iv: string };
    try {
      setPlaintext(await decryptSecret(body.ciphertext, body.iv, key));
      setStatus("revealed");
    } catch {
      setStatus("decrypt_failed");
    }
  }

  async function copySecret() {
    if (!plaintext) return;
    try {
      await navigator.clipboard.writeText(plaintext);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <main id="content" className="shell">
      <section className="card">
        <p className="eyebrow">{revealCopy.eyebrow}</p>
        <h1>{revealCopy.title}</h1>
        {status === "idle" || status === "revealing" || status === "missing_key" ? (
          <>
            <p className="lead">{revealCopy.beforeReveal}</p>
            <p className="muted">{revealCopy.trust}</p>
          </>
        ) : null}
        {view.showRevealAction ? (
          <div className="stack">
            <Button type="button" onClick={reveal} disabled={view.revealDisabled} aria-busy={status === "revealing"}>
              {view.revealLabel}
            </Button>
          </div>
        ) : null}
        {view.showPlaintext && plaintext ? (
          <div className="result">
            <label htmlFor="revealed-secret">{revealCopy.secretLabel}</label>
            <textarea id="revealed-secret" readOnly value={plaintext} />
            <Button type="button" onClick={copySecret}>
              {copied ? revealCopy.copied : revealCopy.copySecret}
            </Button>
          </div>
        ) : null}
        {view.alert ? (
          <Alert tone={view.alert.tone} title={view.alert.title}>
            {view.alert.body}
          </Alert>
        ) : null}
      </section>
    </main>
  );
}
