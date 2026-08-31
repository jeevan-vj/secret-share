import { describe, expect, it } from "vitest";
import {
  beginReveal,
  canStartReveal,
  classifyClaimFailure,
  finishRevealError,
  finishRevealSuccess,
  initialRevealPhase,
} from "../src/lib/reveal-view";

describe("reveal view state", () => {
  it("starts ready and only transitions to revealing once", () => {
    const ready = initialRevealPhase();
    expect(canStartReveal(ready)).toBe(true);
    expect(beginReveal(ready)).toEqual({ kind: "revealing" });
    expect(beginReveal({ kind: "revealing" })).toBeNull();
    expect(beginReveal(finishRevealSuccess("already-shown"))).toBeNull();
    expect(beginReveal(finishRevealError("unavailable"))).toBeNull();
  });

  it("classifies missing key before treating the secret as consumed", () => {
    expect(classifyClaimFailure(false, false)).toBe("missing_key");
    expect(classifyClaimFailure(true, false)).toBe("unavailable");
    expect(classifyClaimFailure(true, true)).toBe("decrypt_failed");
  });

  it("does not lose a successful reveal when a later error arrives", () => {
    const revealed = finishRevealSuccess("only-once");
    expect(revealed).toEqual({ kind: "revealed", plaintext: "only-once" });
    expect(canStartReveal(revealed)).toBe(false);
    expect(beginReveal(revealed)).toBeNull();
  });
});
