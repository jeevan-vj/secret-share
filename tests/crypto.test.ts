import { describe, expect, it } from "vitest";
import { decryptSecret, encryptSecret } from "../src/lib/crypto";
import { base64UrlToBytes, bytesToBase64Url } from "../src/lib/encoding";

describe("client encryption", () => {
  it("round-trips plaintext with AES-256-GCM", async () => {
    const encrypted = await encryptSecret("db-password: swordfish");
    await expect(decryptSecret(encrypted.ciphertext, encrypted.iv, encrypted.key)).resolves.toBe("db-password: swordfish");
  });

  it("does not expose plaintext in ciphertext and uses fresh randomness", async () => {
    const first = await encryptSecret("same-secret");
    const second = await encryptSecret("same-secret");
    expect(first.ciphertext).not.toContain("same-secret");
    expect(first.ciphertext).not.toBe(second.ciphertext);
    expect(first.key).not.toBe(second.key);
    expect(first.iv).not.toBe(second.iv);
    expect(base64UrlToBytes(first.key)).toHaveLength(32);
    expect(base64UrlToBytes(first.iv)).toHaveLength(12);
  });

  it("rejects modified ciphertext", async () => {
    const encrypted = await encryptSecret("do not alter");
    const bytes = base64UrlToBytes(encrypted.ciphertext);
    bytes[0] ^= 1;
    await expect(decryptSecret(bytesToBase64Url(bytes), encrypted.iv, encrypted.key)).rejects.toBeTruthy();
  });
});
