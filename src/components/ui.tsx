import type { ButtonHTMLAttributes, ReactNode } from "react";

export function Wordmark() {
  return (
    <a className="wordmark" href="/">
      <span className="wordmark-mark" aria-hidden="true" />
      Secret Share
    </a>
  );
}

export function Button({
  variant = "primary",
  children,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" }) {
  const classes = ["button", variant === "secondary" ? "button-secondary" : "button-primary", className]
    .filter(Boolean)
    .join(" ");
  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}

export function Alert({
  tone,
  title,
  children,
}: {
  tone: "info" | "success" | "warning" | "danger";
  title?: string | null;
  children: ReactNode;
}) {
  return (
    <div role={tone === "danger" || tone === "warning" ? "alert" : "status"} className={`alert alert-${tone}`}>
      {title ? <strong>{title}</strong> : null}
      {children}
    </div>
  );
}

export function Pills({ items }: { items: string[] }) {
  return (
    <ul className="pills">
      {items.map((item) => (
        <li key={item} className="pill">
          {item}
        </li>
      ))}
    </ul>
  );
}
