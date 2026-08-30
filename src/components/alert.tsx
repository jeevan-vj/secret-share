import type { ReactNode } from "react";

type AlertTone = "info" | "warn" | "danger" | "ok";

export function Alert({
  tone,
  title,
  children,
  role,
}: Readonly<{
  tone: AlertTone;
  title?: string;
  children: ReactNode;
  role?: "alert" | "status";
}>) {
  return (
    <div className={`alert alert-${tone}`} role={role}>
      {title ? <strong>{title}</strong> : null}
      <div>{children}</div>
    </div>
  );
}
