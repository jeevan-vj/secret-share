import type { ReactNode } from "react";
import { AccountNav } from "@/components/account-nav";
import { BrandMark } from "@/components/brand-mark";
import { createCopy, siteCopy } from "@/lib/ui-copy";

function ExternalCreditLink({ href, children }: Readonly<{ href: string; children: ReactNode }>) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
      <span className="visually-hidden"> ({siteCopy.opensInNewTab})</span>
    </a>
  );
}

export function PageShell({ children, footer }: Readonly<{ children: ReactNode; footer: string }>) {
  return (
    <div className="shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <a className="brand" href="/">
          <BrandMark />
          <span>{createCopy.brand}</span>
        </a>
        <div className="header-end">
          <p className="brand-meta">{createCopy.eyebrow}</p>
          <AccountNav />
        </div>
      </header>
      <main className="site-main" id="main">
        {children}
      </main>
      <footer className="site-footer">
        <p>{footer}</p>
        <p className="site-credit">
          <ExternalCreditLink href={siteCopy.builtByHref}>{siteCopy.builtBy}</ExternalCreditLink>
          <span aria-hidden="true">·</span>
          <ExternalCreditLink href={siteCopy.sourceCodeHref}>{siteCopy.sourceCode}</ExternalCreditLink>
        </p>
      </footer>
    </div>
  );
}
