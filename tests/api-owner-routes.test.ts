import { beforeEach, describe, expect, it, vi } from "vitest";

const runtime = vi.hoisted(() => ({
  accountsEnabled: true,
}));

vi.mock("@/lib/runtime-env", () => ({
  isAccountsEnabled: vi.fn(() => runtime.accountsEnabled),
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
  listOwnedSecrets: vi.fn(),
  revokeOwnedSecret: vi.fn(),
}));

import { GET as getMe } from "@/app/api/me/route";
import { GET as listSecrets } from "@/app/api/me/secrets/route";
import { POST as revokeSecret } from "@/app/api/me/secrets/[id]/revoke/route";
import { resolveSessionUser, resolveSessionUserId, SessionLookupError } from "@/lib/request-session";
import { listOwnedSecrets, revokeOwnedSecret } from "@/services/secrets";

const owner = { id: "user-a", email: "a@example.test", emailVerified: true, name: "Ada" };

function cookieRequest(url: string, method = "GET", origin = "https://example.test") {
  return new Request(url, {
    method,
    headers: { cookie: "better-auth.session_token=abc", origin },
  });
}

describe("owner APIs", () => {
  beforeEach(() => {
    runtime.accountsEnabled = true;
    vi.mocked(resolveSessionUserId).mockReset();
    vi.mocked(resolveSessionUser).mockReset();
    vi.mocked(listOwnedSecrets).mockReset();
    vi.mocked(revokeOwnedSecret).mockReset();
  });

  it("hides the session endpoint when accounts are disabled", async () => {
    runtime.accountsEnabled = false;
    const response = await getMe(new Request("https://example.test/api/me"));
    await expect(response.json()).resolves.toEqual({ accountsEnabled: false, user: null });
  });

  it("requires a session for history and never returns ciphertext fields", async () => {
    vi.mocked(resolveSessionUserId).mockResolvedValue("user-a");
    vi.mocked(listOwnedSecrets).mockResolvedValue({
      items: [{ id: "s1", createdAt: "2026-08-31T00:00:00.000Z", expiresAt: "2026-09-01T00:00:00.000Z", status: "available" }],
      nextCursor: null,
    });

    const response = await listSecrets(cookieRequest("https://example.test/api/me/secrets"));
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    const body = (await response.json()) as {
      items: Array<{ id: string; createdAt: string; expiresAt: string; status: string }>;
      nextCursor: string | null;
    };
    expect(body.items[0]).toEqual({
      id: "s1",
      createdAt: "2026-08-31T00:00:00.000Z",
      expiresAt: "2026-09-01T00:00:00.000Z",
      status: "available",
    });
    expect(JSON.stringify(body)).not.toMatch(/ciphertext|iv|plaintext|key|ownerUserId|algorithm/i);
  });

  it("returns 401 for missing sessions and 503 when session lookup fails", async () => {
    vi.mocked(resolveSessionUserId).mockResolvedValueOnce(null);
    const unauthorized = await listSecrets(cookieRequest("https://example.test/api/me/secrets"));
    expect(unauthorized.status).toBe(401);

    vi.mocked(resolveSessionUserId).mockRejectedValueOnce(new SessionLookupError());
    const failed = await listSecrets(cookieRequest("https://example.test/api/me/secrets"));
    expect(failed.status).toBe(503);
    expect(listOwnedSecrets).not.toHaveBeenCalled();
  });

  it("does not list another user's records because the service is called with the session user only", async () => {
    vi.mocked(resolveSessionUserId).mockResolvedValue("user-a");
    vi.mocked(listOwnedSecrets).mockResolvedValue({ items: [], nextCursor: null });
    await listSecrets(cookieRequest("https://example.test/api/me/secrets?limit=20"));
    expect(listOwnedSecrets).toHaveBeenCalledWith("user-a", expect.objectContaining({ limit: 20 }));
  });

  it("lets the owner revoke an available share and is idempotent", async () => {
    vi.mocked(resolveSessionUserId).mockResolvedValue("user-a");
    vi.mocked(revokeOwnedSecret).mockResolvedValueOnce("revoked");
    const first = await revokeSecret(cookieRequest("https://example.test/api/me/secrets/secretid1/revoke", "POST"), {
      params: Promise.resolve({ id: "secretid1" }),
    });
    expect(first.status).toBe(200);
    await expect(first.json()).resolves.toEqual({ ok: true, status: "revoked" });

    vi.mocked(revokeOwnedSecret).mockResolvedValueOnce("already_revoked");
    const second = await revokeSecret(cookieRequest("https://example.test/api/me/secrets/secretid1/revoke", "POST"), {
      params: Promise.resolve({ id: "secretid1" }),
    });
    expect(second.status).toBe(200);
  });

  it("does not disclose another user's, consumed, or missing share on revoke", async () => {
    vi.mocked(resolveSessionUserId).mockResolvedValue("user-a");
    vi.mocked(revokeOwnedSecret).mockResolvedValue("not_found");
    const response = await revokeSecret(cookieRequest("https://example.test/api/me/secrets/otheruser1/revoke", "POST"), {
      params: Promise.resolve({ id: "otheruser1" }),
    });
    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "not_found" });
  });

  it("rejects anonymous and cross-origin revoke attempts", async () => {
    vi.mocked(resolveSessionUserId).mockResolvedValue(null);
    const anonymous = await revokeSecret(new Request("https://example.test/api/me/secrets/secretid1/revoke", { method: "POST" }), {
      params: Promise.resolve({ id: "secretid1" }),
    });
    expect(anonymous.status).toBe(401);

    const csrf = await revokeSecret(
      cookieRequest("https://example.test/api/me/secrets/secretid1/revoke", "POST", "https://evil.example"),
      { params: Promise.resolve({ id: "secretid1" }) },
    );
    expect(csrf.status).toBe(403);
    expect(revokeOwnedSecret).not.toHaveBeenCalled();
  });

  it("returns the signed-in user without session tokens", async () => {
    vi.mocked(resolveSessionUser).mockResolvedValue(owner);
    const response = await getMe(cookieRequest("https://example.test/api/me"));
    const body = await response.json();
    expect(body).toEqual({ accountsEnabled: true, user: owner });
    expect(JSON.stringify(body)).not.toMatch(/token|password|cookie/i);
  });
});
