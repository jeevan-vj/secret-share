import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const createPage = readFileSync(new URL("../src/app/page.tsx", import.meta.url), "utf8");
const revealPage = readFileSync(new URL("../src/app/s/[id]/page.tsx", import.meta.url), "utf8");
const dashboardPage = readFileSync(new URL("../src/app/dashboard/page.tsx", import.meta.url), "utf8");
const signUpLayout = readFileSync(new URL("../src/app/sign-up/layout.tsx", import.meta.url), "utf8");
const signInLayout = readFileSync(new URL("../src/app/sign-in/layout.tsx", import.meta.url), "utf8");
const dashboardLayout = readFileSync(new URL("../src/app/dashboard/layout.tsx", import.meta.url), "utf8");
const authRoute = readFileSync(new URL("../src/app/api/auth/[...all]/route.ts", import.meta.url), "utf8");
const accountsGate = readFileSync(new URL("../src/components/accounts-gate.tsx", import.meta.url), "utf8");
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
    expect(payload).not.toMatch(/ownerUserId|owner_user_id/);
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

describe("dashboard security boundary", () => {
  it("lists metadata only and never decrypts or stores keys", () => {
    expect(dashboardPage).toContain("dashboardCopy.lead");
    expect(dashboardPage).toContain("/api/me/secrets");
    expect(dashboardPage).toContain("/revoke");
    expect(dashboardPage).not.toContain("decryptSecret");
    expect(dashboardPage).not.toContain("ciphertext");
    expect(dashboardPage).not.toContain("localStorage");
    expect(dashboardPage).not.toContain("sessionStorage");
    expect(dashboardPage).not.toContain("buildShareLink");
  });
});

describe("accounts feature-flag boundary", () => {
  it("gates sign-up UI and the Better Auth handler, not only navigation", () => {
    expect(signUpLayout).toContain("accounts-gate");
    expect(signInLayout).toContain("accounts-gate");
    expect(dashboardLayout).toContain("accounts-gate");
    expect(accountsGate).toContain("accountsEnabled");
    expect(accountsGate).toContain("disabledTitle");
    expect(authRoute).toContain("accountsEnabled");
    expect(authRoute).toContain("not_found");
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
