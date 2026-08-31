import type { ReactNode } from "react";
import { AccountNav } from "@/components/account-nav";
import { BrandMark } from "@/components/brand-mark";
import { createCopy } from "@/lib/ui-copy";

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
      </footer>
    </div>
  );
}
