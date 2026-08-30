import { SECRET_TTL_HOURS } from "./ui-copy";

export const SECRET_TTL_MS = SECRET_TTL_HOURS * 60 * 60 * 1000;

export type EncryptedCreateFields = {
  ciphertext: string;
  iv: string;
  algorithm: "A256GCM";
  version: 1;
};

export function buildCreateSecretBody(encrypted: EncryptedCreateFields, now = Date.now()) {
  return {
    ciphertext: encrypted.ciphertext,
    iv: encrypted.iv,
    algorithm: encrypted.algorithm,
    version: encrypted.version,
    deleteAfterView: true as const,
    expiresAt: new Date(now + SECRET_TTL_MS).toISOString(),
  };
}
