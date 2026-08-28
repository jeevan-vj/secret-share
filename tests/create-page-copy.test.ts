import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const page = readFileSync(new URL("../src/app/page.tsx", import.meta.url), "utf8");

describe("create page copy", () => {
  it("labels the share-link copy button as Copy one-time link", () => {
    expect(page).toMatch(/>Copy one-time link<\/button>/);
    expect(page).not.toMatch(/>Copy link<\/button>/);
  });
});
