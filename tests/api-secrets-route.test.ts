import { beforeEach, describe, expect, it, vi } from "vitest";

const createSecretRecord = vi.fn();
const resolveOwnerForCreate = vi.fn();

vi.mock("@/db/client", () => ({ db: {} }));
vi.mock("@/services/secrets", () => ({
  createSecretRecord: (...args: unknown[]) => createSecretRecord(...args),
}));
vi.mock("@/lib/current-session", () => ({
  resolveOwnerForCreate: (...args: unknown[]) => resolveOwnerForCreate(...args),
}));

import { POST } from "@/app/api/secrets/route";

function validBody() {
  return {
    ciphertext: "A".repeat(32),
    iv: "B".repeat(16),
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    deleteAfterView: true,
    version: 1,
    algorithm: "A256GCM",
  };
}

describe("POST /api/secrets", () => {
  beforeEach(() => {
    createSecretRecord.mockReset();
    resolveOwnerForCreate.mockReset();
    createSecretRecord.mockResolvedValue({ id: "new-id" });
    resolveOwnerForCreate.mockResolvedValue({ kind: "anonymous" });
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
  });

  it("creates an anonymous secret when there is no session", async () => {
    const request = new Request("https://example.test/api/secrets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...validBody(), ownerUserId: "forged-user" }),
    });

    const response = await POST(request);

    expect(response.status).toBe(201);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(createSecretRecord).toHaveBeenCalledWith(
      {},
      expect.objectContaining({ ownerUserId: null, ciphertext: "A".repeat(32) }),
    );
    const persisted = createSecretRecord.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(persisted).not.toHaveProperty("key");
    expect(persisted.ownerUserId).toBeNull();
  });

  it("stores only the session user id as owner", async () => {
    resolveOwnerForCreate.mockResolvedValue({ kind: "authenticated", userId: "user-session" });
    const request = new Request("https://example.test/api/secrets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...validBody(), ownerUserId: "forged-user" }),
    });

    await POST(request);

    expect(createSecretRecord).toHaveBeenCalledWith(
      {},
      expect.objectContaining({ ownerUserId: "user-session" }),
    );
  });

  it("fails closed when session lookup is unavailable", async () => {
    resolveOwnerForCreate.mockResolvedValue({ kind: "error", error: "session_unavailable" });
    const request = new Request("https://example.test/api/secrets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validBody()),
    });

    const response = await POST(request);

    expect(response.status).toBe(503);
    expect(createSecretRecord).not.toHaveBeenCalled();
  });
});
