import { describe, expect, it } from "vitest";
import { buildShareLink, readKeyFromFragment } from "../src/lib/share-link";

describe("share links", () => {
  it("puts the key only in the fragment", () => {
    const link = buildShareLink("https://secret.example", "abc123", "super-key");
    const url = new URL(link);
    expect(url.pathname).toBe("/s/abc123");
    expect(url.search).toBe("");
    expect(url.hash).toBe("#k=super-key");
    expect(`${url.origin}${url.pathname}${url.search}`).not.toContain("super-key");
  });

  it("reads the key from a fragment", () => {
    expect(readKeyFromFragment("#k=abc_DEF-123")).toBe("abc_DEF-123");
  });
});
