import { beforeEach, describe, expect, it, vi } from "vitest";

const listOwnedSecrets = vi.fn();
const requireAccountUser = vi.fn();

vi.mock("@/db/client", () => ({ db: {} }));
vi.mock("@/services/secrets", () => ({
  listOwnedSecrets: (...args: unknown[]) => listOwnedSecrets(...args),
}));
vi.mock("@/lib/current-session", () => ({
  requireAccountUser: (...args: unknown[]) => requireAccountUser(...args),
}));

import { GET } from "@/app/api/account/secrets/route";

describe("GET /api/account/secrets", () => {
  beforeEach(() => {
    listOwnedSecrets.mockReset();
    requireAccountUser.mockReset();
  });

  it("returns 401 without a session", async () => {
    requireAccountUser.mockResolvedValue({ kind: "unauthenticated" });
    const response = await GET(new Request("https://example.test/api/account/secrets"));
    expect(response.status).toBe(401);
    expect(listOwnedSecrets).not.toHaveBeenCalled();
  });

  it("returns 404 when accounts are disabled", async () => {
    requireAccountUser.mockResolvedValue({ kind: "disabled" });
    const response = await GET(new Request("https://example.test/api/account/secrets"));
    expect(response.status).toBe(404);
  });

  it("lists only allowlisted metadata for the current user", async () => {
    requireAccountUser.mockResolvedValue({ kind: "authenticated", userId: "user-a" });
    listOwnedSecrets.mockResolvedValue({
      items: [
        {
          id: "s1",
          createdAt: "2026-08-31T00:00:00.000Z",
          expiresAt: "2026-09-01T00:00:00.000Z",
          status: "available",
        },
      ],
      nextCursor: null,
    });

    const response = await GET(new Request("https://example.test/api/account/secrets?limit=20"));
    const body = (await response.json()) as {
      items: Array<{ id: string; createdAt: string; expiresAt: string; status: string }>;
    };

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(listOwnedSecrets).toHaveBeenCalledWith({}, expect.objectContaining({ ownerUserId: "user-a", limit: 20 }));
    expect(body.items[0]).toEqual({
      id: "s1",
      createdAt: "2026-08-31T00:00:00.000Z",
      expiresAt: "2026-09-01T00:00:00.000Z",
      status: "available",
    });
    expect(JSON.stringify(body)).not.toMatch(/ciphertext|iv|key|token|password/i);
  });
});
