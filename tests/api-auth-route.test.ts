import { beforeEach, describe, expect, it, vi } from "vitest";

const { accountsEnabled, innerGET, innerPOST } = vi.hoisted(() => ({
  accountsEnabled: vi.fn(),
  innerGET: vi.fn(),
  innerPOST: vi.fn(),
}));

vi.mock("@/lib/accounts", () => ({
  accountsEnabled,
}));

vi.mock("@/lib/auth", () => ({
  auth: {},
}));

vi.mock("better-auth/next-js", () => ({
  toNextJsHandler: () => ({ GET: innerGET, POST: innerPOST }),
}));

import { GET, POST } from "@/app/api/auth/[...all]/route";

describe("Better Auth handler feature flag", () => {
  beforeEach(() => {
    accountsEnabled.mockReset();
    innerGET.mockReset();
    innerPOST.mockReset();
    innerGET.mockResolvedValue(Response.json({ ok: true }));
    innerPOST.mockResolvedValue(Response.json({ ok: true }));
  });

  it("returns 404 for sign-up when accounts are disabled", async () => {
    accountsEnabled.mockReturnValue(false);
    const response = await POST(new Request("https://example.test/api/auth/sign-up/email", { method: "POST" }));
    expect(response.status).toBe(404);
    expect(innerPOST).not.toHaveBeenCalled();
  });

  it("forwards requests when accounts are enabled", async () => {
    accountsEnabled.mockReturnValue(true);
    const request = new Request("https://example.test/api/auth/get-session");
    const response = await GET(request);
    expect(response.status).toBe(200);
    expect(innerGET).toHaveBeenCalledTimes(1);
  });
});
