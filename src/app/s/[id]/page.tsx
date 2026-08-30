"use client";

import { useRef, useState } from "react";
import { Alert } from "@/components/alert";
import { Button } from "@/components/button";
import { PageShell } from "@/components/page-shell";
import { decryptSecret } from "@/lib/crypto";
import {
  beginReveal,
  classifyClaimFailure,
  finishRevealError,
  finishRevealSuccess,
  initialRevealPhase,
  type RevealPhase,
} from "@/lib/reveal-view";
import { readKeyFromFragment } from "@/lib/share-link";
import { revealCopy } from "@/lib/ui-copy";

function errorCopy(reason: Extract<RevealPhase, { kind: "error" }>["reason"]) {
  if (reason === "missing_key") {
    return { title: revealCopy.missingKeyTitle, body: revealCopy.missingKeyBody };
  }
  if (reason === "unavailable") {
    return { title: revealCopy.unavailableTitle, body: revealCopy.unavailableBody };
  }
  return { title: revealCopy.decryptFailedTitle, body: revealCopy.decryptFailedBody };
}

export default function RevealPage({ params }: { params: Promise<{ id: string }> }) {
  const [phase, setPhase] = useState<RevealPhase>(initialRevealPhase);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  async function reveal() {
    const next = beginReveal(phaseRef.current);
    if (!next) return;
    phaseRef.current = next;
    setPhase(next);
    setCopied(false);
    setCopyError(null);

    const { id } = await params;
    const key = readKeyFromFragment(window.location.hash);
    if (!key) {
      const error = finishRevealError(classifyClaimFailure(false, false));
      phaseRef.current = error;
      setPhase(error);
      return;
    }

    try {
      const response = await fetch(`/api/secrets/${encodeURIComponent(id)}/claim`, {
        method: "POST",
        cache: "no-store",
      });
      if (!response.ok) {
        const error = finishRevealError(classifyClaimFailure(true, false));
        phaseRef.current = error;
        setPhase(error);
        return;
      }

      const body = (await response.json()) as { ciphertext: string; iv: string };
      try {
        const plaintext = await decryptSecret(body.ciphertext, body.iv, key);
        const revealed = finishRevealSuccess(plaintext);
        phaseRef.current = revealed;
        setPhase(revealed);
      } catch {
        const error = finishRevealError(classifyClaimFailure(true, true));
        phaseRef.current = error;
        setPhase(error);
      }
    } catch {
      const error = finishRevealError("unavailable");
      phaseRef.current = error;
      setPhase(error);
    }
  }

  async function copySecret() {
    if (phase.kind !== "revealed") return;
    try {
      await navigator.clipboard.writeText(phase.plaintext);
      setCopied(true);
      setCopyError(null);
    } catch {
      setCopied(false);
      setCopyError(revealCopy.copyFailed);
    }
  }

  const error = phase.kind === "error" ? errorCopy(phase.reason) : null;

  return (
    <PageShell footer={revealCopy.footer}>
      <section className="narrow">
        <section className="card card-accent stack">
          <p className="eyebrow">{revealCopy.eyebrow}</p>
          <h1>{phase.kind === "revealed" ? revealCopy.revealedTitle : revealCopy.title}</h1>

          {phase.kind === "ready" || phase.kind === "revealing" ? (
            <>
              <p className="lead">{revealCopy.lead}</p>
              <Alert tone="warn">{revealCopy.trust}</Alert>
              <Button onClick={reveal} disabled={phase.kind === "revealing"} aria-busy={phase.kind === "revealing"}>
                {phase.kind === "revealing" ? revealCopy.revealing : revealCopy.reveal}
              </Button>
            </>
          ) : null}

          {phase.kind === "revealed" ? (
            <div className="stack">
              <Alert tone="ok">{revealCopy.revealedLead}</Alert>
              <div className="field">
                <label className="field-label" htmlFor="revealed-secret">
                  Secret
                </label>
                <textarea id="revealed-secret" readOnly value={phase.plaintext} onFocus={(event) => event.currentTarget.select()} />
              </div>
              <Button onClick={copySecret}>{copied ? revealCopy.copied : revealCopy.copySecret}</Button>
              {copyError ? (
                <p role="alert" className="alert alert-danger">
                  {copyError}
                </p>
              ) : null}
            </div>
          ) : null}

          {error ? (
            <Alert tone="danger" title={error.title} role="alert">
              {error.body}
            </Alert>
          ) : null}
        </section>
      </section>
    </PageShell>
  );
}
