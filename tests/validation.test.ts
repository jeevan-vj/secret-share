import { describe, expect, it } from "vitest";
import { createSecretSchema } from "../src/lib/validation";

function validPayload() {
  return {
    ciphertext: "A".repeat(32),
    iv: "B".repeat(16),
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    deleteAfterView: true,
    version: 1 as const,
    algorithm: "A256GCM" as const,
  };
}

describe("create-secret input", () => {
  it("accepts ciphertext metadata without plaintext or key fields", () => {
    expect(createSecretSchema.safeParse(validPayload()).success).toBe(true);
  });

  it("rejects expired and excessive retention", () => {
    expect(createSecretSchema.safeParse({ ...validPayload(), expiresAt: new Date(Date.now() - 1_000).toISOString() }).success).toBe(false);
    expect(createSecretSchema.safeParse({ ...validPayload(), expiresAt: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString() }).success).toBe(false);
  });

  it("rejects non-one-time secrets in V1", () => {
    expect(createSecretSchema.safeParse({ ...validPayload(), deleteAfterView: false }).success).toBe(false);
  });

  it("accepts ciphertext large enough for the UI's maximum Unicode plaintext", () => {
    expect(createSecretSchema.safeParse({ ...validPayload(), ciphertext: "A".repeat(400_100) }).success).toBe(true);
  });
});
