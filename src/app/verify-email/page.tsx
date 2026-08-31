import { Alert } from "@/components/ui";
import { accountCopy } from "@/lib/ui-copy";

export default function VerifyEmailPage() {
  return (
    <main id="content" className="shell">
      <section className="card">
        <p className="eyebrow">{accountCopy.signInEyebrow}</p>
        <h1>{accountCopy.verifyTitle}</h1>
        <p className="lead">{accountCopy.verifyLead}</p>
        <Alert tone="info">{accountCopy.verifyPending}</Alert>
      </section>
    </main>
  );
}
