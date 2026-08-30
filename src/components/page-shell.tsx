import type { ReactNode } from "react";
import { BrandMark } from "@/components/brand-mark";
import { createCopy } from "@/lib/ui-copy";

export function PageShell({ children, footer }: { children: ReactNode; footer: string }) {
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
        <p className="brand-meta">{createCopy.eyebrow}</p>
      </header>
      <div className="site-main" id="main">
        {children}
      </div>
      <footer className="site-footer">
        <p>{footer}</p>
      </footer>
    </div>
  );
}
