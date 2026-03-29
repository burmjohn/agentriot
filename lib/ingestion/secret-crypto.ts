import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

export type EncryptedApiKeySecret = {
  algorithm: "aes-256-gcm";
  ciphertext: string;
  nonce: string;
};

function getEncryptionKey(key: string) {
  const buffer = Buffer.from(key, "utf8");

  if (buffer.length !== 32) {
    throw new Error("API_KEY_ENCRYPTION_KEY must be exactly 32 bytes.");
  }

  return buffer;
}

export function encryptApiKeySecret(
  secret: string,
  key: string,
): EncryptedApiKeySecret {
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(key), nonce);
  const ciphertext = Buffer.concat([
    cipher.update(secret, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return {
    algorithm: "aes-256-gcm",
    ciphertext: Buffer.concat([ciphertext, authTag]).toString("base64url"),
    nonce: nonce.toString("base64url"),
  };
}

export function decryptApiKeySecret(
  encrypted: EncryptedApiKeySecret,
  key: string,
) {
  const payload = Buffer.from(encrypted.ciphertext, "base64url");
  const nonce = Buffer.from(encrypted.nonce, "base64url");
  const ciphertext = payload.subarray(0, payload.length - 16);
  const authTag = payload.subarray(payload.length - 16);
  const decipher = createDecipheriv(
    encrypted.algorithm,
    getEncryptionKey(key),
    nonce,
  );

  decipher.setAuthTag(authTag);

  return Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString("utf8");
}
