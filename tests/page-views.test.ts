import { describe, expect, it } from "vitest";
import { getCreateView, getRevealView } from "../src/lib/page-views";
import { createCopy, revealCopy } from "../src/lib/ui-copy";

describe("create page view", () => {
  it("keeps the form visible and the primary action disabled while empty", () => {
    const view = getCreateView({ secret: "", busy: false, shareLink: null, error: null });
    expect(view.status).toBe("idle");
    expect(view.showForm).toBe(true);
    expect(view.showResult).toBe(false);
    expect(view.submitDisabled).toBe(true);
    expect(view.submitLabel).toBe(createCopy.submit);
  });

  it("shows a busy label without revealing a result", () => {
    const view = getCreateView({ secret: "token", busy: true, shareLink: null, error: null });
    expect(view.status).toBe("busy");
    expect(view.submitDisabled).toBe(true);
    expect(view.submitLabel).toBe(createCopy.submitting);
    expect(view.showResult).toBe(false);
  });

  it("replaces the form with the share-link result after success", () => {
    const view = getCreateView({
      secret: "",
      busy: false,
      shareLink: "https://example.test/s/abc#k=key",
      error: null,
    });
    expect(view.status).toBe("ready");
    expect(view.showForm).toBe(false);
    expect(view.showResult).toBe(true);
  });

  it("keeps the form available after a create failure", () => {
    const view = getCreateView({
      secret: "token",
      busy: false,
      shareLink: null,
      error: createCopy.error,
    });
    expect(view.status).toBe("error");
    expect(view.showForm).toBe(true);
    expect(view.showResult).toBe(false);
  });
});

describe("reveal page view", () => {
  it("shows the reveal action in the idle and missing-key states", () => {
    expect(getRevealView("idle").showRevealAction).toBe(true);
    expect(getRevealView("missing_key").showRevealAction).toBe(true);
    expect(getRevealView("missing_key").alert?.tone).toBe("danger");
  });

  it("disables the action while claiming", () => {
    const view = getRevealView("revealing");
    expect(view.showRevealAction).toBe(true);
    expect(view.revealDisabled).toBe(true);
    expect(view.revealLabel).toBe(revealCopy.revealing);
  });

  it("hides a second reveal after success, consume, or decrypt failure", () => {
    expect(getRevealView("revealed").showRevealAction).toBe(false);
    expect(getRevealView("revealed").showPlaintext).toBe(true);
    expect(getRevealView("unavailable").showRevealAction).toBe(false);
    expect(getRevealView("unavailable").alert?.title).toBe(revealCopy.unavailableTitle);
    expect(getRevealView("decrypt_failed").showRevealAction).toBe(false);
    expect(getRevealView("decrypt_failed").showPlaintext).toBe(false);
  });
});
