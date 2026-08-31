import { describe, expect, it, vi } from "vitest";
import { createMailerFromEnv, createResendMailer } from "../src/lib/mail";

describe("auth mailer", () => {
  it("sends verification mail without logging the token URL", async () => {
    const fetchImpl = vi.fn(async () => new Response("{}", { status: 200 }));
    const send = createResendMailer({
      apiKey: "re_test",
      from: "Secret Share <noreply@example.com>",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    await send({
      to: "user@example.com",
      kind: "verify",
      url: "https://secret.example/api/auth/verify-email?token=super-secret-token",
    });

    expect(fetchImpl).toHaveBeenCalledOnce();
    const init = fetchImpl.mock.calls[0]?.[1] as RequestInit;
    expect(String(init.headers)).not.toContain("super-secret-token");
    const body = JSON.parse(String(init.body)) as { text: string; to: string[] };
    expect(body.to).toEqual(["user@example.com"]);
    expect(body.text).toContain("super-secret-token");
  });

  it("is unconfigured without mail credentials", () => {
    expect(createMailerFromEnv({})).toBeNull();
  });
});
