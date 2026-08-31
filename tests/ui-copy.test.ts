import { describe, expect, it } from "vitest";
import {
  accountCopy,
  authCopy,
  chromeCopy,
  createCopy,
  revealCopy,
  SECRET_MAX_LENGTH,
  SECRET_TTL_HOURS,
  siteCopy,
} from "../src/lib/ui-copy";

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

describe("account and dashboard copy", () => {
  it("states that history cannot recover the fragment key or full share link", () => {
    expect(accountCopy.lead.toLowerCase()).toContain("management metadata");
    expect(accountCopy.lead.toLowerCase()).toContain("fragment");
    expect(accountCopy.lead.toLowerCase()).toContain("cannot recover");
    expect(authCopy.signUpLead.toLowerCase()).toContain("cannot decrypt");
    expect(createCopy.signedInNote.toLowerCase()).toContain("fragment");
    expect(authCopy.socialLead.toLowerCase()).toContain("identity provider");
    expect(authCopy.socialPrivacy.toLowerCase()).toContain("never receives");
  });
});

describe("homepage auth and security copy", () => {
  it("offers Sign in and Sign up without requiring an account to share", () => {
    expect(createCopy.signIn).toBe("Sign in");
    expect(createCopy.signUp).toBe("Sign up");
    expect(createCopy.optionalAccount.toLowerCase()).toContain("optional");
    expect(createCopy.optionalAccount.toLowerCase()).toMatch(/without signing in|not required/);
    expect(createCopy.optionalAccount.toLowerCase()).not.toMatch(/must sign|required to create|required to share/);
  });

  it("explains browser AES-256-GCM, ciphertext-only storage, fragment keys, and one-time consume", () => {
    const explainer = [
      createCopy.securityTitle,
      createCopy.securityEncrypt,
      createCopy.securityServer,
      createCopy.securityKey,
      createCopy.securityOnce,
      createCopy.securityGone,
    ].join(" ");

    expect(explainer.toLowerCase()).toContain("aes-256-gcm");
    expect(createCopy.securityEncrypt.toLowerCase()).toContain("browser");
    expect(createCopy.securityServer.toLowerCase()).toContain("ciphertext");
    expect(createCopy.securityServer.toLowerCase()).toMatch(/operational metadata|metadata/);
    expect(createCopy.securityKey.toLowerCase()).toMatch(/url fragment|fragment/);
    expect(createCopy.securityKey.toLowerCase()).toMatch(/never sent to|never stored/);
    expect(createCopy.securityOnce.toLowerCase()).toMatch(/one-time|atomically consumed|first successful reveal/);
    expect(createCopy.securityGone.toLowerCase()).toMatch(/expired/);
    expect(createCopy.securityGone.toLowerCase()).toMatch(/consumed/);
    expect(createCopy.securityGone.toLowerCase()).toMatch(/revoked/);
    expect(createCopy.securityGone.toLowerCase()).toContain("cannot be retrieved");
  });

  it("does not claim that signing in can recover a key, plaintext, or full share URL", () => {
    const homepage = [
      createCopy.optionalAccount,
      createCopy.securityTitle,
      createCopy.securityEncrypt,
      createCopy.securityServer,
      createCopy.securityKey,
      createCopy.securityOnce,
      createCopy.securityGone,
      createCopy.signedInNote,
    ].join(" ").toLowerCase();

    expect(homepage).not.toMatch(/sign(?:ing)? in (?:can |will )?recover/);
    expect(homepage).not.toMatch(/account (?:can |will )?recover/);
  });
});

describe("site footer copy", () => {
  it("credits iamjeevan.com and links to the public source repository", () => {
    expect(siteCopy.builtBy).toBe("Built by iamjeevan.com");
    expect(siteCopy.builtByHref).toBe("https://iamjeevan.com");
    expect(siteCopy.sourceCode).toBe("Source code");
    expect(siteCopy.sourceCodeHref).toBe("https://github.com/jeevan-vj/secret-share");
    expect(chromeCopy.signIn).toBe("Sign in");
  });
});
