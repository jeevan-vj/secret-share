import { describe, expect, it, vi } from "vitest";

vi.mock("@/services/secrets", () => ({
  createSecretRecord: vi.fn(),
}));

import { POST } from "@/app/api/secrets/route";

describe("POST /api/secrets", () => {
  it("returns 400 for malformed JSON", async () => {
    const request = new Request("https://example.test/api/secrets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{not-json",
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "invalid_request" });
  });
});
