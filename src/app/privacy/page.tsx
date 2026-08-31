import { PageShell } from "@/components/page-shell";
import { createCopy } from "@/lib/ui-copy";

export const metadata = {
  title: "Privacy policy | Secret Share",
  description: "How Secret Share protects secrets and handles account data.",
};

export default function PrivacyPage() {
  return (
    <PageShell footer={createCopy.footer}>
      <article className="narrow policy stack">
        <header>
          <p className="eyebrow">Policies</p>
          <h1>Privacy policy</h1>
          <p className="muted">Effective 1 September 2026</p>
        </header>

        <section>
          <h2>Your secrets stay private</h2>
          <p>
            Secret Share encrypts and decrypts secret contents in your browser. The server stores the encrypted
            ciphertext, a random initialization value, expiry time, and operational metadata needed to enforce one-time
            access. It cannot read your secret.
          </p>
          <p>
            The decryption key stays in the URL fragment after the <code>#</code>. Browsers do not send that fragment to
            the server. Anyone with the complete share link can reveal the secret, so protect it like a password.
          </p>
        </section>

        <section>
          <h2>Account information</h2>
          <p>
            Accounts are optional. If you create one, we process your email address, display name, verification and
            session records, and limited secret-management metadata such as creation and expiry times. Account history
            cannot recover a secret or recreate its full share link.
          </p>
          <p>
            When you sign in with Google or GitHub, those providers supply standard identity and profile information.
            Google and GitHub never receive your secret contents or decryption key from Secret Share. Provider access
            tokens are encrypted at rest.
          </p>
        </section>

        <section>
          <h2>Email and retention</h2>
          <p>
            Resend delivers verification and password-reset emails and therefore processes the destination email address
            and the temporary verification or reset link. It does not receive secret contents, ciphertext, share links,
            or decryption keys.
          </p>
          <p>
            Unclaimed secrets expire after no more than 24 hours and cannot be retrieved after they are consumed or
            expired. We retain account and security records only as needed to operate, protect, and comply with legal
            obligations for the service.
          </p>
        </section>

        <section>
          <h2>Contact</h2>
          <p>
            For privacy questions or account-data requests, email{" "}
            <a href="mailto:jeevan90wijerathna@gmail.com">jeevan90wijerathna@gmail.com</a>.
          </p>
        </section>
      </article>
    </PageShell>
  );
}
