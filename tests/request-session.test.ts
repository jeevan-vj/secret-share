import { describe, expect, it } from "vitest";
import { requireAuthenticatedUser, resolveRequestSession } from "../src/lib/request-session";

describe("session resolution", () => {
  it("treats a missing session as anonymous", async () => {
    await expect(resolveRequestSession(async () => null)).resolves.toEqual({ kind: "anonymous" });
  });

  it("returns the authenticated user id", async () => {
    await expect(resolveRequestSession(async () => ({ user: { id: "user-1" } }))).resolves.toEqual({
      kind: "authenticated",
      userId: "user-1",
    });
  });

  it("fails closed when session lookup throws", async () => {
    await expect(
      resolveRequestSession(async () => {
        throw new Error("d1 unavailable");
      }),
    ).resolves.toEqual({ kind: "error", error: "session_unavailable" });
  });

  it("does not treat expired or missing sessions as authenticated", async () => {
    await expect(requireAuthenticatedUser(async () => null)).resolves.toEqual({ kind: "unauthenticated" });
  });
});
