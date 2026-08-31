import { createCopy, revealCopy } from "./ui-copy";

export type CreateStatus = "idle" | "busy" | "ready" | "error";

export function getCreateView(input: {
  secret: string;
  busy: boolean;
  shareLink: string | null;
  error: string | null;
}) {
  const status: CreateStatus = input.busy
    ? "busy"
    : input.shareLink
      ? "ready"
      : input.error
        ? "error"
        : "idle";

  return {
    status,
    showForm: !input.shareLink,
    showResult: Boolean(input.shareLink),
    submitDisabled: input.busy || !input.secret,
    submitLabel: input.busy ? createCopy.submitting : createCopy.submit,
  };
}

export type RevealStatus = "idle" | "revealing" | "revealed" | "missing_key" | "unavailable" | "decrypt_failed";

export function getRevealView(status: RevealStatus) {
  return {
    status,
    showRevealAction: status === "idle" || status === "missing_key" || status === "revealing",
    showPlaintext: status === "revealed",
    revealDisabled: status === "revealing",
    revealLabel: status === "revealing" ? revealCopy.revealing : revealCopy.reveal,
    alert:
      status === "missing_key"
        ? { tone: "danger" as const, title: revealCopy.missingKey, body: revealCopy.missingKeyHint }
        : status === "unavailable"
          ? { tone: "warning" as const, title: revealCopy.unavailableTitle, body: revealCopy.unavailable }
          : status === "decrypt_failed"
            ? { tone: "danger" as const, title: revealCopy.decryptFailedTitle, body: revealCopy.decryptFailed }
            : status === "revealed"
              ? { tone: "success" as const, title: null, body: revealCopy.afterReveal }
              : null,
  };
}
