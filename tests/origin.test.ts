import { describe, expect, it } from "vitest";
import { isTrustedMutationRequest } from "../src/lib/origin";

const trusted = ["https://example.test"];

describe("trusted mutation origin", () => {
  it("accepts a matching Origin", () => {
    const request = new Request("https://example.test/api/me/secrets/abc/revoke", {
      method: "POST",
      headers: { Origin: "https://example.test" },
    });
    expect(isTrustedMutationRequest(request, trusted)).toBe(true);
  });

  it("rejects a cross-origin Origin", () => {
    const request = new Request("https://example.test/api/me/secrets/abc/revoke", {
      method: "POST",
      headers: { Origin: "https://evil.test" },
    });
    expect(isTrustedMutationRequest(request, trusted)).toBe(false);
  });

  it("accepts same-origin fetch metadata without Origin", () => {
    const request = new Request("https://example.test/api/me/secrets/abc/revoke", {
      method: "POST",
      headers: { "Sec-Fetch-Site": "same-origin" },
    });
    expect(isTrustedMutationRequest(request, trusted)).toBe(true);
  });

  it("rejects a request with no origin, referer, or same-origin fetch metadata", () => {
    const request = new Request("https://example.test/api/me/secrets/abc/revoke", { method: "POST" });
    expect(isTrustedMutationRequest(request, trusted)).toBe(false);
  });
});
