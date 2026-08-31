import { afterEach, describe, expect, it, vi } from "vitest";
import { readMemoryInbox, resetMemoryInbox, sendAuthEmail } from "../src/lib/mail";

describe("auth mail adapter", () => {
  afterEach(() => {
    resetMemoryInbox();
    vi.unstubAllGlobals();
  });

  it("stores verification mail in memory without logging the action URL", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const info = vi.spyOn(console, "info").mockImplementation(() => {});

    await sendAuthEmail(
      { MAIL_PROVIDER: "memory" },
      { to: "user@example.test", purpose: "verify", actionUrl: "https://example.test/verify?token=secret-token" },
    );

    expect(readMemoryInbox()).toHaveLength(1);
    expect(readMemoryInbox()[0]?.purpose).toBe("verify");
    expect(JSON.stringify(log.mock.calls)).not.toContain("secret-token");
    expect(JSON.stringify(error.mock.calls)).not.toContain("secret-token");
    expect(JSON.stringify(info.mock.calls)).not.toContain("secret-token");
    log.mockRestore();
    error.mockRestore();
    info.mockRestore();
  });

  it("fails closed when mail is unconfigured", async () => {
    await expect(
      sendAuthEmail({ MAIL_PROVIDER: "none" }, { to: "user@example.test", purpose: "reset", actionUrl: "https://example.test/reset" }),
    ).rejects.toThrow("mail_unconfigured");
  });
});
