import { PageShell } from "@/components/page-shell";
import { createCopy } from "@/lib/ui-copy";

export const metadata = {
  title: "Terms of use | Secret Share",
  description: "Terms for using Secret Share.",
};

export default function TermsPage() {
  return (
    <PageShell footer={createCopy.footer}>
      <article className="narrow policy stack">
        <header>
          <p className="eyebrow">Policies</p>
          <h1>Terms of use</h1>
          <p className="muted">Effective 1 September 2026</p>
        </header>

        <section>
          <h2>Using the service</h2>
          <p>
            You may use Secret Share to send lawful information that you have the right to share. Do not use the
            service to harm others, distribute malware, violate privacy, evade security controls, or break applicable
            law.
          </p>
        </section>

        <section>
          <h2>Protect the share link</h2>
          <p>
            A complete share link is a bearer credential: anyone who has it may be able to reveal the secret once.
            Secret Share cannot recover a lost decryption key or recreate the full link. You are responsible for choosing
            a safe channel and intended recipient.
          </p>
        </section>

        <section>
          <h2>Availability and responsibility</h2>
          <p>
            The service is provided as available without a promise that it will always be uninterrupted or error-free.
            Do not use it as the only copy of important information. To the extent permitted by law, the operator is not
            responsible for loss caused by a lost, intercepted, expired, revoked, or already-consumed link.
          </p>
        </section>

        <section>
          <h2>Changes and contact</h2>
          <p>
            These terms may be updated when the service changes. Continued use after an update means you accept the new
            terms. Questions can be sent to{" "}
            <a href="mailto:jeevan90wijerathna@gmail.com">jeevan90wijerathna@gmail.com</a>.
          </p>
        </section>
      </article>
    </PageShell>
  );
}
