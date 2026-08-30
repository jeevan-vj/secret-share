import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
};

export function Button({ variant = "primary", className, type = "button", ...props }: Readonly<ButtonProps>) {
  return <button type={type} className={["btn", `btn-${variant}`, className].filter(Boolean).join(" ")} {...props} />;
}
