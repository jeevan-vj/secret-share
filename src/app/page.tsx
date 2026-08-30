"use client";

import { FormEvent, useState } from "react";
import { Alert } from "@/components/alert";
import { Button } from "@/components/button";
import { PageShell } from "@/components/page-shell";
import { TrustList } from "@/components/trust-list";
import { buildCreateSecretBody } from "@/lib/create-secret-request";
import { encryptSecret } from "@/lib/crypto";
import { buildShareLink } from "@/lib/share-link";
import { createCopy, SECRET_MAX_LENGTH } from "@/lib/ui-copy";

function formatCount(length: number) {
  return `${length.toLocaleString("en-US")} / ${SECRET_MAX_LENGTH.toLocaleString("en-US")}`;
}

export default function HomePage() {
  const [secret, setSecret] = useState("");
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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
        body: JSON.stringify(buildCreateSecretBody(encrypted)),
      });
      if (!response.ok) throw new Error("Unable to create secret");
      const { id } = (await response.json()) as { id: string };
      setShareLink(buildShareLink(window.location.origin, id, encrypted.key));
      setSecret("");
    } catch {
      setError(createCopy.createError);
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setError(null);
    } catch {
      setCopied(false);
      setError(createCopy.copyFailed);
    }
  }

  function reset() {
    setShareLink(null);
    setCopied(false);
    setError(null);
    setSecret("");
  }

  return (
    <PageShell footer={createCopy.footer}>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">{createCopy.eyebrow}</p>
          <h1>{shareLink ? createCopy.resultTitle : createCopy.title}</h1>
          <p className="lead">{shareLink ? createCopy.resultLead : createCopy.lead}</p>
          {shareLink ? null : (
            <>
              <p className="muted">{createCopy.oneTime}</p>
              <p className="muted">{createCopy.expiry}</p>
              <TrustList items={[createCopy.trustEncrypted, createCopy.trustKey, createCopy.trustOnce]} />
            </>
          )}
        </div>

        <section className="card card-accent">
          <div className="stack">
            {shareLink ? (
              <>
                <Alert tone="ok" title={createCopy.resultReadyTitle} role="status">
                  {createCopy.resultReadyBody}
                </Alert>
                <div className="field">
                  <label className="field-label" htmlFor="share-link">
                    {createCopy.resultLinkLabel}
                  </label>
                  <textarea
                    id="share-link"
                    className="mono result-link"
                    rows={3}
                    readOnly
                    value={shareLink}
                    onFocus={(event) => event.currentTarget.select()}
                  />
                </div>
                <div className="actions">
                  <Button onClick={copyLink}>{copied ? createCopy.copied : createCopy.copyLink}</Button>
                  <Button variant="secondary" onClick={reset}>
                    {createCopy.shareAnother}
                  </Button>
                </div>
              </>
            ) : (
              <form className="stack" onSubmit={submit}>
                <div className="field">
                  <label className="field-label" htmlFor="secret">
                    {createCopy.secretLabel}
                  </label>
                  <textarea
                    id="secret"
                    value={secret}
                    onChange={(event) => setSecret(event.target.value)}
                    required
                    minLength={1}
                    maxLength={SECRET_MAX_LENGTH}
                    autoComplete="off"
                    spellCheck={false}
                    aria-describedby="secret-hint secret-count"
                  />
                  <div className="field-meta">
                    <span id="secret-hint">{createCopy.secretHint}</span>
                    <span id="secret-count">{formatCount(secret.length)}</span>
                  </div>
                </div>
                <Alert tone="warn">{`${createCopy.oneTime} ${createCopy.expiry}`}</Alert>
                <Button type="submit" disabled={busy || !secret}>
                  {busy ? createCopy.submitting : createCopy.submit}
                </Button>
              </form>
            )}
            {error ? (
              <Alert tone="danger" role="alert">
                {error}
              </Alert>
            ) : null}
          </div>
        </section>
      </section>

      <section className="steps" aria-labelledby="how-it-works">
        <h2 id="how-it-works">{createCopy.howTitle}</h2>
        <div className="step-grid">
          <article className="step">
            <span className="step-index">1</span>
            <h3>{createCopy.howStep1Title}</h3>
            <p>{createCopy.howStep1Body}</p>
          </article>
          <article className="step">
            <span className="step-index">2</span>
            <h3>{createCopy.howStep2Title}</h3>
            <p>{createCopy.howStep2Body}</p>
          </article>
          <article className="step">
            <span className="step-index">3</span>
            <h3>{createCopy.howStep3Title}</h3>
            <p>{createCopy.howStep3Body}</p>
          </article>
        </div>
      </section>
    </PageShell>
  );
}
