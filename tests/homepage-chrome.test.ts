import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createCopy, siteCopy } from "../src/lib/ui-copy";

const createPage = readFileSync(new URL("../src/app/page.tsx", import.meta.url), "utf8");
const pageShell = readFileSync(new URL("../src/components/page-shell.tsx", import.meta.url), "utf8");
const layout = readFileSync(new URL("../src/app/layout.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../src/app/styles.css", import.meta.url), "utf8");

describe("homepage auth links", () => {
  it("renders Sign in and Sign up routes without gating secret creation", () => {
    expect(createPage).toContain('href="/sign-in"');
    expect(createPage).toContain('href="/sign-up"');
    expect(createPage).toContain("createCopy.signIn");
    expect(createPage).toContain("createCopy.signUp");
    expect(createPage).toContain("createCopy.optionalAccount");
    expect(createPage).toContain("encryptSecret");
    expect(createPage).not.toMatch(/if\s*\(\s*!signedIn\s*\)\s*(return|throw)/);
    expect(createPage).not.toMatch(/window\.location\.assign\(\s*["']\/sign-in["']/);
  });
});

describe("homepage security explainer", () => {
  it("includes the security explainer block on the create page", () => {
    expect(createPage).toContain("createCopy.securityTitle");
    expect(createPage).toContain("createCopy.securityEncrypt");
    expect(createPage).toContain("createCopy.securityServer");
    expect(createPage).toContain("createCopy.securityKey");
    expect(createPage).toContain("createCopy.securityOnce");
    expect(createPage).toContain("createCopy.securityGone");
    expect(createPage).toMatch(/aria-labelledby=["']security-model["']/);
    expect(createCopy.securityEncrypt).toMatch(/AES-256-GCM/);
  });
});

describe("site footer attribution", () => {
  it("credits the creator and links to the public repository with safe external attributes", () => {
    expect(pageShell).toContain("siteCopy.builtByHref");
    expect(pageShell).toContain("siteCopy.sourceCodeHref");
    expect(pageShell).toContain('target="_blank"');
    expect(pageShell).toContain('rel="noopener noreferrer"');
    expect(siteCopy.builtByHref).toBe("https://iamjeevan.com");
    expect(siteCopy.sourceCodeHref).toBe("https://github.com/jeevan-vj/secret-share");
    expect(pageShell).not.toMatch(/analytics|gtag|plausible|third.party/i);
  });

  it("does not add third-party scripts on create or layout chrome", () => {
    expect(createPage).not.toMatch(/<script[\s>]/);
    expect(layout).not.toMatch(/<script[\s>]/);
    expect(layout).not.toMatch(/googleapis|googletagmanager|analytics/i);
  });
});

describe("homepage accessibility chrome", () => {
  it("keeps visible focus styles and wraps footer credit on small screens", () => {
    expect(styles).toContain(":focus-visible");
    expect(styles).toContain(".site-credit");
    expect(styles).toContain(".security-explainer");
    expect(styles).toContain(".auth-links");
  });
});
