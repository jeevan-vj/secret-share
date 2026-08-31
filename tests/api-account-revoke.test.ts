import { beforeEach, describe, expect, it, vi } from "vitest";

const revokeSecretRecord = vi.fn();
const requireAccountUser = vi.fn();
const trustedOriginsFromEnv = vi.fn(() => ["https://example.test"]);

vi.mock("@/db/client", () => ({ db: {} }));
vi.mock("@/services/secrets", () => ({
  revokeSecretRecord: (...args: unknown[]) => revokeSecretRecord(...args),
}));
vi.mock("@/lib/current-session", () => ({
  requireAccountUser: (...args: unknown[]) => requireAccountUser(...args),
  trustedOriginsFromEnv: () => trustedOriginsFromEnv(),
}));

import { POST } from "@/app/api/account/secrets/[id]/revoke/route";

function revokeRequest(origin = "https://example.test") {
  return new Request("https://example.test/api/account/secrets/sec-1/revoke", {
    method: "POST",
    headers: { origin },
  });
}

describe("POST /api/account/secrets/:id/revoke", () => {
  beforeEach(() => {
    revokeSecretRecord.mockReset();
    requireAccountUser.mockReset();
    trustedOriginsFromEnv.mockReturnValue(["https://example.test"]);
  });

  it("rejects cross-origin mutations", async () => {
    const response = await POST(revokeRequest("https://evil.example"), {
      params: Promise.resolve({ id: "sec-1" }),
    });
    expect(response.status).toBe(403);
    expect(revokeSecretRecord).not.toHaveBeenCalled();
  });

  it("rejects anonymous callers", async () => {
    requireAccountUser.mockResolvedValue({ kind: "unauthenticated" });
    const response = await POST(revokeRequest(), { params: Promise.resolve({ id: "sec-1" }) });
    expect(response.status).toBe(401);
  });

  it("does not disclose another user's or missing record", async () => {
    requireAccountUser.mockResolvedValue({ kind: "authenticated", userId: "user-a" });
    revokeSecretRecord.mockResolvedValue("not_found");
    const missing = await POST(revokeRequest(), { params: Promise.resolve({ id: "missing" }) });
    revokeSecretRecord.mockResolvedValue("not_revocable");
    const consumed = await POST(revokeRequest(), { params: Promise.resolve({ id: "consumed" }) });
    expect(missing.status).toBe(404);
    expect(consumed.status).toBe(404);
    await expect(missing.json()).resolves.toEqual({ error: "not_found" });
    await expect(consumed.json()).resolves.toEqual({ error: "not_found" });
  });

  it("revokes an available owned share and is idempotent", async () => {
    requireAccountUser.mockResolvedValue({ kind: "authenticated", userId: "user-a" });
    revokeSecretRecord.mockResolvedValue("revoked");
    const first = await POST(revokeRequest(), { params: Promise.resolve({ id: "sec-1" }) });
    revokeSecretRecord.mockResolvedValue("already_revoked");
    const second = await POST(revokeRequest(), { params: Promise.resolve({ id: "sec-1" }) });
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    await expect(first.json()).resolves.toEqual({ revoked: true });
    await expect(second.json()).resolves.toEqual({ revoked: true });
    expect(revokeSecretRecord).toHaveBeenCalledWith({}, { id: "sec-1", ownerUserId: "user-a" });
  });
});
