import { describe, expect, it } from "vitest";
import { chromeCopy, createCopy, revealCopy } from "../src/lib/ui-copy";

describe("create-page copy", () => {
  it("keeps the zero-knowledge trust message on the landing page", () => {
    expect(createCopy.lead.toLowerCase()).toContain("browser");
    expect(createCopy.lead.toLowerCase()).toContain("fragment");
    expect(createCopy.title.toLowerCase()).toContain("server");
  });

  it("explains one-time expiry before a link is created", () => {
    expect(createCopy.oneTime.toLowerCase()).toContain("one-time");
    expect(createCopy.oneTime.toLowerCase()).toContain("first successful reveal");
    expect(createCopy.expires.toLowerCase()).toContain("24 hours");
    expect(createCopy.viewOnce.toLowerCase()).toContain("once");
  });

  it("makes the primary create and copy actions explicit", () => {
    expect(createCopy.submit).toMatch(/encrypt/i);
    expect(createCopy.copyLink).toBe("Copy one-time link");
    expect(createCopy.createAnother.toLowerCase()).toContain("another");
  });
});

describe("reveal-page copy", () => {
  it("explains one-time consumption before the reveal action", () => {
    expect(revealCopy.beforeReveal.toLowerCase()).toContain("once");
    expect(revealCopy.beforeReveal.toLowerCase()).toContain("stops working");
  });

  it("preserves client-side decryption and fragment-key language", () => {
    expect(revealCopy.trust.toLowerCase()).toContain("browser");
    expect(revealCopy.trust.toLowerCase()).toContain("fragment");
    expect(revealCopy.trust.toLowerCase()).toContain("never sent");
  });

  it("uses distinct consumed, missing-key, and decrypt-failure messages", () => {
    expect(revealCopy.unavailable.toLowerCase()).toMatch(/expired|already been viewed/);
    expect(revealCopy.missingKey.toLowerCase()).toContain("decryption key");
    expect(revealCopy.decryptFailed.toLowerCase()).toContain("decrypt");
    expect(new Set([revealCopy.unavailable, revealCopy.missingKey, revealCopy.decryptFailed]).size).toBe(3);
  });
});

describe("chrome copy", () => {
  it("repeats the client-side encryption cue without recovery language", () => {
    expect(chromeCopy.footer.toLowerCase()).toContain("client-side");
    expect(chromeCopy.footer.toLowerCase()).toContain("keys stay");
  });
});
