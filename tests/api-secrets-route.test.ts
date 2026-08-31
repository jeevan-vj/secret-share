import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/runtime-env", () => ({
  isAccountsEnabled: vi.fn(() => true),
  getTrustedOrigins: vi.fn(() => ["https://example.test"]),
}));

vi.mock("@/lib/request-session", () => {
  class SessionLookupError extends Error {
    readonly code = "session_lookup_failed" as const;
    constructor() {
      super("session_lookup_failed");
      this.name = "SessionLookupError";
    }
  }
  return {
    SessionLookupError,
    resolveSessionUserId: vi.fn(),
    resolveSessionUser: vi.fn(),
  };
});

vi.mock("@/services/secrets", () => ({
  createSecretRecord: vi.fn(),
  claimSecretRecord: vi.fn(),
  listOwnedSecrets: vi.fn(),
  revokeOwnedSecret: vi.fn(),
}));

import { POST as createSecret } from "@/app/api/secrets/route";
import { POST as claimSecret } from "@/app/api/secrets/[id]/claim/route";
import { SessionLookupError, resolveSessionUserId } from "@/lib/request-session";
import { createSecretRecord, claimSecretRecord } from "@/services/secrets";

const validBody = {
  ciphertext: "A".repeat(32),
  iv: "B".repeat(16),
  expiresAt: new Date(Date.now() + 60_000).toISOString(),
  deleteAfterView: true,
  version: 1,
  algorithm: "A256GCM",
};

function jsonRequest(url: string, body: unknown, headers: HeadersInit = {}) {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", origin: "https://example.test", ...headers },
    body: JSON.stringify(body),
  });
}

describe("POST /api/secrets", () => {
  beforeEach(() => {
    vi.mocked(resolveSessionUserId).mockReset();
    vi.mocked(createSecretRecord).mockReset();
    vi.mocked(claimSecretRecord).mockReset();
  });
  it("returns 400 for malformed JSON", async () => {
    const request = new Request("https://example.test/api/secrets", {
      method: "POST",
      headers: { "Content-Type": "application/json", origin: "https://example.test" },
      body: "{not-json",
    });

    const response = await createSecret(request);

    expect(response.status).toBe(400);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({ error: "invalid_request" });
  });

  it("stores a session-derived owner and ignores a client-supplied ownerUserId", async () => {
    vi.mocked(resolveSessionUserId).mockResolvedValue("user-a");
    vi.mocked(createSecretRecord).mockResolvedValue({ id: "secret-1" });

    const response = await createSecret(
      jsonRequest("https://example.test/api/secrets", { ...validBody, ownerUserId: "forged-user" }),
    );

    expect(response.status).toBe(201);
    expect(createSecretRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        ciphertext: validBody.ciphertext,
        ownerUserId: "user-a",
      }),
    );
    expect(vi.mocked(createSecretRecord).mock.calls[0][0]).not.toHaveProperty("ownerUserId", "forged-user");
  });

  it("creates anonymous shares when no session is present", async () => {
    vi.mocked(resolveSessionUserId).mockResolvedValue(null);
    vi.mocked(createSecretRecord).mockResolvedValue({ id: "secret-2" });

    const response = await createSecret(jsonRequest("https://example.test/api/secrets", validBody));

    expect(response.status).toBe(201);
    expect(createSecretRecord).toHaveBeenCalledWith(expect.objectContaining({ ownerUserId: null }));
  });

  it("fails closed when session lookup throws instead of creating an anonymous share", async () => {
    vi.mocked(resolveSessionUserId).mockRejectedValue(new SessionLookupError());

    const response = await createSecret(
      jsonRequest("https://example.test/api/secrets", validBody, { cookie: "better-auth.session_token=abc" }),
    );

    expect(response.status).toBe(503);
    expect(createSecretRecord).not.toHaveBeenCalled();
  });

  it("rejects cookie-authenticated creates from an untrusted origin", async () => {
    const response = await createSecret(
      jsonRequest("https://example.test/api/secrets", validBody, {
        cookie: "better-auth.session_token=abc",
        origin: "https://evil.example",
      }),
    );

    expect(response.status).toBe(403);
    expect(createSecretRecord).not.toHaveBeenCalled();
  });
});

describe("POST /api/secrets/:id/claim", () => {
  it("returns the standard unavailable response with no-store", async () => {
    vi.mocked(claimSecretRecord).mockResolvedValue(null);
    const response = await claimSecret(new Request("https://example.test/api/secrets/abc/claim", { method: "POST" }), {
      params: Promise.resolve({ id: "abc" }),
    });

    expect(response.status).toBe(404);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({ error: "not_found" });
  });
});
