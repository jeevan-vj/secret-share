import { describe, expect, it } from "vitest";
import { createCopy, revealCopy, SECRET_MAX_LENGTH, SECRET_TTL_HOURS } from "../src/lib/ui-copy";

describe("create-page copy", () => {
  it("states client-side encryption and fragment-only keys", () => {
    const text = `${createCopy.lead} ${createCopy.trustEncrypted} ${createCopy.trustKey} ${createCopy.footer}`;
    expect(text.toLowerCase()).toContain("browser");
    expect(text.toLowerCase()).toContain("ciphertext");
    expect(text.toLowerCase()).toMatch(/url fragment|fragment/);
    expect(text.toLowerCase()).toContain("never sent to the server");
  });

  it("explains one-time consume and 24-hour expiry before the sender shares", () => {
    expect(createCopy.oneTime.toLowerCase()).toContain("one-time");
    expect(createCopy.oneTime.toLowerCase()).toMatch(/first successful reveal|viewed once/);
    expect(createCopy.expiry).toContain(String(SECRET_TTL_HOURS));
    expect(createCopy.expiry.toLowerCase()).toContain("expire");
    expect(createCopy.resultLead.toLowerCase()).toContain("once");
    expect(createCopy.resultReadyBody.toLowerCase()).toContain("fragment");
  });

  it("keeps the secret field bound to the existing client max length", () => {
    expect(SECRET_MAX_LENGTH).toBe(100_000);
    expect(createCopy.secretHint).toContain("100,000");
    expect(createCopy.secretLabel).toBe("Secret");
  });
});

describe("reveal-page copy", () => {
  it("explains one-time consume before the recipient reveals", () => {
    expect(revealCopy.lead.toLowerCase()).toContain("once");
    expect(revealCopy.lead.toLowerCase()).toMatch(/consumes|consume/);
    expect(revealCopy.trust.toLowerCase()).toMatch(/url fragment|fragment/);
    expect(revealCopy.trust.toLowerCase()).toContain("not sent to the server");
  });

  it("keeps consumed, missing-key, and decrypt-failure states distinct and honest", () => {
    expect(revealCopy.unavailableBody.toLowerCase()).toMatch(/expired|already been viewed/);
    expect(revealCopy.unavailableBody.toLowerCase()).toContain("cannot be retrieved");
    expect(revealCopy.missingKeyBody.toLowerCase()).toContain("fragment");
    expect(revealCopy.missingKeyBody.toLowerCase()).toContain("never stored on the server");
    expect(revealCopy.decryptFailedBody.toLowerCase()).toMatch(/invalid|modified/);
  });
});
