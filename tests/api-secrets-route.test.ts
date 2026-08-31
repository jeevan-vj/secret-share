import { beforeEach, describe, expect, it, vi } from "vitest";

const createSecretRecord = vi.fn();
const resolveCreateOwner = vi.fn();

vi.mock("@/services/secrets", () => ({
  createSecretRecord,
}));

vi.mock("@/lib/session", () => ({
  resolveCreateOwner,
}));

vi.mock("@/db/client", () => ({
  db: { name: "test-db" },
}));

import { POST } from "@/app/api/secrets/route";

function validBody(extra: Record<string, unknown> = {}) {
  return {
    ciphertext: "A".repeat(32),
    iv: "B".repeat(16),
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    deleteAfterView: true,
    version: 1,
    algorithm: "A256GCM",
    ...extra,
  };
}

describe("POST /api/secrets", () => {
  beforeEach(() => {
    createSecretRecord.mockReset();
    resolveCreateOwner.mockReset();
    createSecretRecord.mockResolvedValue({ id: "new-secret" });
    resolveCreateOwner.mockResolvedValue({ status: "anonymous", userId: null });
  });

  it("returns 400 for malformed JSON", async () => {
    const request = new Request("https://example.test/api/secrets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{not-json",
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "invalid_request" });
    expect(createSecretRecord).not.toHaveBeenCalled();
  });

  it("creates an anonymous secret when there is no session", async () => {
    const request = new Request("https://example.test/api/secrets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validBody()),
    });

    const response = await POST(request);
    expect(response.status).toBe(201);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(createSecretRecord).toHaveBeenCalledWith(
      { name: "test-db" },
      expect.objectContaining({ ownerUserId: null, ciphertext: "A".repeat(32) }),
    );
  });

  it("stores the session user id and ignores a client-supplied ownerUserId", async () => {
    resolveCreateOwner.mockResolvedValue({ status: "authenticated", userId: "session-user" });
    const request = new Request("https://example.test/api/secrets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validBody({ ownerUserId: "forged-user", email: "attacker@example.test" })),
    });

    const response = await POST(request);
    expect(response.status).toBe(201);
    const [, input] = createSecretRecord.mock.calls[0] as [unknown, { ownerUserId?: string | null }];
    expect(input.ownerUserId).toBe("session-user");
    expect(JSON.stringify(input)).not.toContain("forged-user");
  });

  it("fails closed when session lookup is unavailable", async () => {
    resolveCreateOwner.mockResolvedValue({ status: "error" });
    const request = new Request("https://example.test/api/secrets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validBody()),
    });

    const response = await POST(request);
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ error: "unavailable" });
    expect(createSecretRecord).not.toHaveBeenCalled();
  });
});
