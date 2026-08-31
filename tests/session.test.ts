import { beforeEach, describe, expect, it, vi } from "vitest";

const getSession = vi.fn();
const accountsEnabled = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession } },
}));

vi.mock("@/lib/accounts", () => ({
  accountsEnabled,
}));

import { requireAccountSession, resolveCreateOwner } from "../src/lib/session";

describe("resolveCreateOwner", () => {
  beforeEach(() => {
    getSession.mockReset();
    accountsEnabled.mockReset();
  });

  it("stays anonymous when accounts are disabled", async () => {
    accountsEnabled.mockReturnValue(false);
    await expect(resolveCreateOwner(new Request("https://example.test/api/secrets"))).resolves.toEqual({
      status: "anonymous",
      userId: null,
    });
    expect(getSession).not.toHaveBeenCalled();
  });

  it("stays anonymous when there is no session", async () => {
    accountsEnabled.mockReturnValue(true);
    getSession.mockResolvedValue(null);
    await expect(resolveCreateOwner(new Request("https://example.test/api/secrets"))).resolves.toEqual({
      status: "anonymous",
      userId: null,
    });
  });

  it("returns the session user id when authenticated", async () => {
    accountsEnabled.mockReturnValue(true);
    getSession.mockResolvedValue({ user: { id: "user-1" } });
    await expect(resolveCreateOwner(new Request("https://example.test/api/secrets"))).resolves.toEqual({
      status: "authenticated",
      userId: "user-1",
    });
  });

  it("fails closed when session lookup throws", async () => {
    accountsEnabled.mockReturnValue(true);
    getSession.mockRejectedValue(new Error("d1 unavailable"));
    await expect(resolveCreateOwner(new Request("https://example.test/api/secrets"))).resolves.toEqual({
      status: "error",
    });
  });
});

describe("requireAccountSession", () => {
  beforeEach(() => {
    getSession.mockReset();
    accountsEnabled.mockReset();
  });

  it("returns 404 when accounts are disabled", async () => {
    accountsEnabled.mockReturnValue(false);
    const result = await requireAccountSession(new Request("https://example.test/api/me/secrets"));
    expect("error" in result).toBe(true);
    if ("error" in result) expect(result.error.status).toBe(404);
  });

  it("returns 401 without a session", async () => {
    accountsEnabled.mockReturnValue(true);
    getSession.mockResolvedValue(null);
    const result = await requireAccountSession(new Request("https://example.test/api/me/secrets"));
    expect("error" in result).toBe(true);
    if ("error" in result) expect(result.error.status).toBe(401);
  });

  it("returns 503 when session lookup fails", async () => {
    accountsEnabled.mockReturnValue(true);
    getSession.mockRejectedValue(new Error("d1 unavailable"));
    const result = await requireAccountSession(new Request("https://example.test/api/me/secrets"));
    expect("error" in result).toBe(true);
    if ("error" in result) expect(result.error.status).toBe(503);
  });
});
