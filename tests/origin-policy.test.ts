import { describe, expect, it } from "vitest";
import { isTrustedMutationRequest } from "../src/lib/origin";

const trusted = ["https://secret.example"];

describe("trusted mutation origin", () => {
  it("accepts an exact Origin match", () => {
    const request = new Request("https://secret.example/api/account/secrets/x/revoke", {
      method: "POST",
      headers: { origin: "https://secret.example" },
    });
    expect(isTrustedMutationRequest(request, trusted)).toBe(true);
  });

  it("rejects a cross-origin Origin", () => {
    const request = new Request("https://secret.example/api/account/secrets/x/revoke", {
      method: "POST",
      headers: { origin: "https://evil.example" },
    });
    expect(isTrustedMutationRequest(request, trusted)).toBe(false);
  });

  it("fails closed without Origin or Referer", () => {
    const request = new Request("https://secret.example/api/account/secrets/x/revoke", { method: "POST" });
    expect(isTrustedMutationRequest(request, trusted)).toBe(false);
  });
});
