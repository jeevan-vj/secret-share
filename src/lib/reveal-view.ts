export type RevealReason = "missing_key" | "unavailable" | "decrypt_failed";

export type RevealPhase =
  | { kind: "ready" }
  | { kind: "revealing" }
  | { kind: "revealed"; plaintext: string }
  | { kind: "error"; reason: RevealReason };

export function initialRevealPhase(): RevealPhase {
  return { kind: "ready" };
}

export function beginReveal(phase: RevealPhase): RevealPhase | null {
  if (phase.kind !== "ready") return null;
  return { kind: "revealing" };
}

export function finishRevealSuccess(plaintext: string): RevealPhase {
  return { kind: "revealed", plaintext };
}

export function finishRevealError(reason: RevealReason): RevealPhase {
  return { kind: "error", reason };
}

export function classifyClaimFailure(hasKey: boolean, responseOk: boolean): RevealReason {
  if (!hasKey) return "missing_key";
  if (!responseOk) return "unavailable";
  return "decrypt_failed";
}

export function canStartReveal(phase: RevealPhase): boolean {
  return phase.kind === "ready";
}
