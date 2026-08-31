import type { ReactNode } from "react";
import { PageShell } from "@/components/page-shell";
import { createCopy } from "@/lib/ui-copy";

export function AuthShell({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <PageShell footer={createCopy.footer}>
      <section className="narrow">
        <section className="card card-accent stack">{children}</section>
      </section>
    </PageShell>
  );
}
