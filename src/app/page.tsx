"use client";

import { FormEvent, useState } from "react";
import { encryptSecret } from "@/lib/crypto";
import { buildShareLink } from "@/lib/share-link";

export default function HomePage() {
  const [secret, setSecret] = useState("");
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
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
      setError("Could not create the encrypted share link.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="shell">
      <section className="card">
        <p className="eyebrow">SECRET SHARE</p>
        <h1>Share a secret without giving the server the key.</h1>
        <p className="muted">Encryption happens in this browser. The decryption key is stored only in the share link fragment.</p>
        <p className="muted">One-time secrets become unavailable after the first successful reveal.</p>
        <form onSubmit={submit}>
          <label htmlFor="secret">Secret</label>
          <textarea id="secret" value={secret} onChange={(e) => setSecret(e.target.value)} required minLength={1} maxLength={100000} autoComplete="off" spellCheck={false} />
          <button type="submit" disabled={busy || !secret}>{busy ? "Encrypting…" : "Encrypt & create link"}</button>
        </form>
        {shareLink && <div className="result"><strong>One-time link</strong><input readOnly value={shareLink} onFocus={(e) => e.currentTarget.select()} /><button type="button" onClick={() => navigator.clipboard.writeText(shareLink)}>Copy one-time link</button></div>}
        {error && <p role="alert" className="error">{error}</p>}
      </section>
    </main>
  );
}
