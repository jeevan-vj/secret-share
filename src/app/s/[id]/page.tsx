"use client";

import { useState } from "react";
import { decryptSecret } from "@/lib/crypto";
import { readKeyFromFragment } from "@/lib/share-link";

export default function RevealPage({ params }: { params: Promise<{ id: string }> }) {
  const [plaintext, setPlaintext] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function reveal() {
    const { id } = await params;
    const key = readKeyFromFragment(window.location.hash);
    if (!key) {
      setMessage("This link is missing its decryption key.");
      return;
    }

    const response = await fetch(`/api/secrets/${encodeURIComponent(id)}/claim`, { method: "POST", cache: "no-store" });
    if (!response.ok) {
      setMessage("This secret is unavailable. It may have expired or already been viewed.");
      return;
    }

    const body = (await response.json()) as { ciphertext: string; iv: string };
    try {
      setPlaintext(await decryptSecret(body.ciphertext, body.iv, key));
    } catch {
      setMessage("The secret could not be decrypted. The link may be invalid or modified.");
    }
  }

  return (
    <main className="shell"><section className="card">
      <p className="eyebrow">ONE-TIME SECRET</p>
      <h1>Reveal encrypted secret</h1>
      {!plaintext && <button type="button" onClick={reveal}>Reveal and consume secret</button>}
      {plaintext && <div className="result"><strong>Secret</strong><textarea readOnly value={plaintext} /><button type="button" onClick={() => navigator.clipboard.writeText(plaintext)}>Copy secret</button></div>}
      {message && <p role="alert" className="error">{message}</p>}
    </section></main>
  );
}
