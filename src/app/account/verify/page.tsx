import { accountCopy } from "@/lib/ui-copy";

export default function VerifyPage() {
  return (
    <main id="content" className="shell">
      <section className="card">
        <p className="eyebrow">{accountCopy.eyebrow}</p>
        <h1>{accountCopy.verifyTitle}</h1>
        <p className="lead">{accountCopy.verifyLead}</p>
        <p className="muted">
          <a href="/account/sign-in">{accountCopy.haveAccount}</a>
        </p>
      </section>
    </main>
  );
}
