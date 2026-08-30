import { describe, expect, it } from "vitest";
import { buildCreateSecretBody, SECRET_TTL_MS } from "../src/lib/create-secret-request";

describe("create-secret request body", () => {
  const encrypted = {
    ciphertext: "ciphertext-value",
    iv: "iv-value",
    algorithm: "A256GCM" as const,
    version: 1 as const,
    key: "must-never-be-copied",
  };

  it("sends ciphertext metadata only — no plaintext and no decryption key", () => {
    const body = buildCreateSecretBody(encrypted, Date.parse("2026-08-30T12:00:00.000Z"));
    expect(body).toEqual({
      ciphertext: "ciphertext-value",
      iv: "iv-value",
      algorithm: "A256GCM",
      version: 1,
      deleteAfterView: true,
      expiresAt: "2026-08-31T12:00:00.000Z",
    });
    expect(JSON.stringify(body)).not.toContain("must-never-be-copied");
    expect(body).not.toHaveProperty("key");
    expect(body).not.toHaveProperty("plaintext");
    expect(body).not.toHaveProperty("secret");
  });

  it("uses a 24-hour one-time retention window", () => {
    expect(SECRET_TTL_MS).toBe(24 * 60 * 60 * 1000);
    expect(buildCreateSecretBody(encrypted).deleteAfterView).toBe(true);
  });
});
