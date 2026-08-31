import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const createPage = readFileSync(new URL("../src/app/page.tsx", import.meta.url), "utf8");
const revealPage = readFileSync(new URL("../src/app/s/[id]/page.tsx", import.meta.url), "utf8");
const accountPage = readFileSync(new URL("../src/app/account/page.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../src/app/styles.css", import.meta.url), "utf8");

describe("create page security boundary", () => {
  it("encrypts in the browser and only posts ciphertext metadata", () => {
    expect(createPage).toContain("encryptSecret");
    expect(createPage).toContain("buildShareLink");
    const payload = createPage.match(/JSON\.stringify\(\{([\s\S]*?)\}\)/)?.[1] ?? "";
    expect(payload).toContain("ciphertext");
    expect(payload).toContain("iv");
    expect(payload).not.toMatch(/\bkey\b/);
    expect(payload).not.toMatch(/\bsecret\b/);
    expect(payload).not.toContain("ownerUserId");
  });

  it("keeps the generated key in the fragment-only share link builder", () => {
    expect(createPage).toMatch(/buildShareLink\(\s*window\.location\.origin,\s*id,\s*encrypted\.key\s*\)/);
  });
});

describe("reveal page security boundary", () => {
  it("reads the key only from the URL fragment and never sends it to the claim API", () => {
    expect(revealPage).toContain("readKeyFromFragment(window.location.hash)");
    expect(revealPage).toContain("decryptSecret");
    expect(revealPage).toMatch(/fetch\(`\/api\/secrets\/\$\{encodeURIComponent\(id\)\}\/claim`/);
    expect(revealPage).not.toMatch(/fetch\([\s\S]*hash/);
    expect(revealPage).not.toMatch(/body:\s*[\s\S]*key/);
    expect(revealPage).not.toContain("localStorage");
    expect(revealPage).not.toContain("sessionStorage");
  });
});

describe("account dashboard security boundary", () => {
  it("does not claim, decrypt, or reconstruct a share URL", () => {
    expect(accountPage).not.toContain("decryptSecret");
    expect(accountPage).not.toContain("ciphertext");
    expect(accountPage).not.toContain("#k=");
    expect(accountPage).not.toContain("localStorage");
    expect(accountPage).toContain("/api/account/secrets");
    expect(accountPage).not.toMatch(/https?:\/\/[^"'`]+#k=/);
  });
});

describe("design system accessibility tokens", () => {
  it("defines reusable color, type, and focus tokens", () => {
    expect(styles).toContain("--accent");
    expect(styles).toContain("--ink");
    expect(styles).toContain("--paper");
    expect(styles).toContain(":focus-visible");
    expect(styles).toContain("prefers-reduced-motion");
  });
});
