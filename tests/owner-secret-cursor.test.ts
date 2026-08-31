import { describe, expect, it } from "vitest";
import { decodeOwnerSecretCursor, encodeOwnerSecretCursor } from "../src/services/secrets";

describe("owner secret cursor", () => {
  it("round-trips a valid timestamp and id", () => {
    const createdAt = new Date("2026-08-31T11:00:00.000Z");
    const encoded = encodeOwnerSecretCursor({ createdAt, id: "secret-1" });
    expect(decodeOwnerSecretCursor(encoded)).toEqual({ createdAt, id: "secret-1" });
  });

  it("rejects malformed and out-of-range timestamps instead of producing an invalid Date", () => {
    expect(decodeOwnerSecretCursor("not-a-cursor")).toBeNull();
    expect(decodeOwnerSecretCursor("_secret")).toBeNull();
    expect(decodeOwnerSecretCursor("abc_secret")).toBeNull();
    const decoded = decodeOwnerSecretCursor("999999999999999999999_x");
    expect(decoded).toBeNull();
  });
});
