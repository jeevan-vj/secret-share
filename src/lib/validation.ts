import { z } from "zod";

const base64Url = /^[A-Za-z0-9_-]+$/;
const MAX_CIPHERTEXT_CHARS = 410_000;

export const createSecretSchema = z.object({
  ciphertext: z.string().min(16).max(MAX_CIPHERTEXT_CHARS).regex(base64Url),
  iv: z.string().min(16).max(32).regex(base64Url),
  expiresAt: z.string().datetime(),
  deleteAfterView: z.literal(true).default(true),
  version: z.literal(1),
  algorithm: z.literal("A256GCM"),
}).superRefine((value, ctx) => {
  const expiry = Date.parse(value.expiresAt);
  const now = Date.now();
  if (expiry <= now || expiry > now + 7 * 24 * 60 * 60 * 1000) {
    ctx.addIssue({ code: "custom", path: ["expiresAt"], message: "Expiry must be within the next 7 days" });
  }
});
