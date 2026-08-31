import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireAccountSession, listOwnedSecrets, revokeOwnedSecret, isTrustedMutationRequest } = vi.hoisted(() => ({
  requireAccountSession: vi.fn(),
  listOwnedSecrets: vi.fn(),
  revokeOwnedSecret: vi.fn(),
  isTrustedMutationRequest: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  requireAccountSession,
}));

vi.mock("@/services/secrets", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/secrets")>();
  return {
    ...actual,
    listOwnedSecrets,
    revokeOwnedSecret,
  };
});

vi.mock("@/lib/origin", () => ({
  isTrustedMutationRequest,
}));

vi.mock("@/lib/env", () => ({
  parseTrustedOrigins: () => ["https://example.test"],
}));

vi.mock("@/db/client", () => ({
  db: { name: "test-db" },
}));

import { GET } from "@/app/api/me/secrets/route";
import { POST as revoke } from "@/app/api/me/secrets/[id]/revoke/route";

const allowlisted = {
  id: "secret-1",
  createdAt: "2026-08-31T11:00:00.000Z",
  expiresAt: "2026-09-01T11:00:00.000Z",
  status: "available",
};

describe("GET /api/me/secrets", () => {
  beforeEach(() => {
    requireAccountSession.mockReset();
    listOwnedSecrets.mockReset();
  });

  it("returns 401 without a session", async () => {
    requireAccountSession.mockResolvedValue({
      error: Response.json({ error: "unauthorized" }, { status: 401 }),
    });
    const response = await GET(new Request("https://example.test/api/me/secrets"));
    expect(response.status).toBe(401);
    expect(listOwnedSecrets).not.toHaveBeenCalled();
  });

  it("lists only the current user's allowlisted metadata", async () => {
    requireAccountSession.mockResolvedValue({ userId: "user-a" });
    listOwnedSecrets.mockResolvedValue({ items: [allowlisted], nextCursor: null });

    const response = await GET(new Request("https://example.test/api/me/secrets?limit=20"));
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    const body = await response.json();
    expect(body).toEqual({ items: [allowlisted], nextCursor: null });
    expect(JSON.stringify(body)).not.toMatch(/ciphertext|iv|plaintext|key|session/i);
    expect(listOwnedSecrets).toHaveBeenCalledWith(
      { name: "test-db" },
      expect.objectContaining({ ownerUserId: "user-a", limit: 20 }),
    );
  });

  it("returns 400 for an out-of-range cursor timestamp", async () => {
    requireAccountSession.mockResolvedValue({ userId: "user-a" });
    const response = await GET(
      new Request("https://example.test/api/me/secrets?cursor=999999999999999999999_x"),
    );
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "invalid_request" });
    expect(listOwnedSecrets).not.toHaveBeenCalled();
  });
});

describe("POST /api/me/secrets/:id/revoke", () => {
  beforeEach(() => {
    requireAccountSession.mockReset();
    revokeOwnedSecret.mockReset();
    isTrustedMutationRequest.mockReset();
    isTrustedMutationRequest.mockReturnValue(true);
  });

  it("rejects cross-origin mutations", async () => {
    isTrustedMutationRequest.mockReturnValue(false);
    const response = await revoke(new Request("https://example.test/api/me/secrets/abc123abc123abcd/revoke", { method: "POST" }), {
      params: Promise.resolve({ id: "abc123abc123abcd" }),
    });
    expect(response.status).toBe(403);
    expect(revokeOwnedSecret).not.toHaveBeenCalled();
  });

  it("returns 401 for anonymous callers", async () => {
    requireAccountSession.mockResolvedValue({
      error: Response.json({ error: "unauthorized" }, { status: 401 }),
    });
    const response = await revoke(new Request("https://example.test/api/me/secrets/abc123abc123abcd/revoke", { method: "POST" }), {
      params: Promise.resolve({ id: "abc123abc123abcd" }),
    });
    expect(response.status).toBe(401);
  });

  it("does not disclose another user's or missing record", async () => {
    requireAccountSession.mockResolvedValue({ userId: "user-a" });
    revokeOwnedSecret.mockResolvedValue("not_found");
    const response = await revoke(new Request("https://example.test/api/me/secrets/abc123abc123abcd/revoke", { method: "POST" }), {
      params: Promise.resolve({ id: "abc123abc123abcd" }),
    });
    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "not_found" });
  });

  it("revokes an owned available share and treats repeat revoke as success", async () => {
    requireAccountSession.mockResolvedValue({ userId: "user-a" });
    revokeOwnedSecret.mockResolvedValue("revoked");
    const response = await revoke(new Request("https://example.test/api/me/secrets/abc123abc123abcd/revoke", { method: "POST" }), {
      params: Promise.resolve({ id: "abc123abc123abcd" }),
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: "revoked" });
    expect(revokeOwnedSecret).toHaveBeenCalledWith({ name: "test-db" }, { id: "abc123abc123abcd", ownerUserId: "user-a" });
  });
});
