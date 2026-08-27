import { base64UrlToBytes, bytesToBase64Url } from "./encoding";

export type EncryptedSecret = {
  version: 1;
  algorithm: "A256GCM";
  iv: string;
  ciphertext: string;
  key: string;
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export async function encryptSecret(plaintext: string): Promise<EncryptedSecret> {
  const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoder.encode(plaintext));
  const rawKey = await crypto.subtle.exportKey("raw", key);

  return {
    version: 1,
    algorithm: "A256GCM",
    iv: bytesToBase64Url(iv),
    ciphertext: bytesToBase64Url(new Uint8Array(ciphertext)),
    key: bytesToBase64Url(new Uint8Array(rawKey)),
  };
}

export async function decryptSecret(ciphertext: string, iv: string, keyValue: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", base64UrlToBytes(keyValue), { name: "AES-GCM" }, false, ["decrypt"]);
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64UrlToBytes(iv) },
    key,
    base64UrlToBytes(ciphertext),
  );
  return decoder.decode(plaintext);
}
