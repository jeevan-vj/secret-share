import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory()) return sourceFiles(path);
    return entry.name.endsWith(".ts") || entry.name.endsWith(".tsx") ? [path] : [];
  });
}

describe("logging boundary", () => {
  it("does not log secrets, keys, tokens, or request bodies", () => {
    const files = sourceFiles(new URL("../src", import.meta.url).pathname);
    expect(files.length).toBeGreaterThan(10);
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      expect(source, file).not.toMatch(/\bconsole\.(log|info|debug|error|warn)\s*\(/);
      expect(source, file).not.toMatch(/logger\.(log|info|debug)\(/);
    }
  });
});
