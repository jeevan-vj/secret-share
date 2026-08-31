import { describe, expect, it } from "vitest";
import nextConfig from "../next.config";
import { proxy } from "../src/proxy";

describe("production security headers", () => {
  it("isolates secret pages from third-party content and framing", async () => {
    const rules = await nextConfig.headers();
    const headers = Object.fromEntries(rules[0].headers.map(({ key, value }) => [key, value]));

    expect(rules[0].source).toBe("/:path*");
    expect(headers["Content-Security-Policy"]).toContain("default-src 'self'");
    expect(headers["Content-Security-Policy"]).toContain("frame-ancestors 'none'");
    expect(headers["Content-Security-Policy"]).toContain("object-src 'none'");
    expect(headers["Referrer-Policy"]).toBe("no-referrer");
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(headers["X-Frame-Options"]).toBe("DENY");
  });

  it("applies the policy to streamed app responses through middleware", () => {
    const response = proxy();

    expect(response.headers.get("Content-Security-Policy")).toContain("frame-ancestors 'none'");
    expect(response.headers.get("Referrer-Policy")).toBe("no-referrer");
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(response.headers.get("X-Frame-Options")).toBe("DENY");
  });
});
