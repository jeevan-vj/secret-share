import { accountsEnabled } from "@/lib/accounts";
import { accountCopy } from "@/lib/ui-copy";

export default function AccountsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  if (!accountsEnabled()) {
    return (
      <main id="content" className="shell">
        <section className="card">
          <p className="eyebrow">{accountCopy.signInEyebrow}</p>
          <h1>{accountCopy.disabledTitle}</h1>
          <p className="lead">{accountCopy.disabledLead}</p>
        </section>
      </main>
    );
  }

  return children;
}
