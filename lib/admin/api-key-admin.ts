import { db } from "@/db";
import { apiKeys } from "@/db/schema";
import type { normalizeApiKeyInput } from "@/lib/admin/api-key-input";
import { env } from "@/lib/env";
import { buildApiKeyRecord, generateApiKeySecret } from "@/lib/ingestion/api-keys";
import { encryptApiKeySecret } from "@/lib/ingestion/secret-crypto";

type AdminApiKeyInput = ReturnType<typeof normalizeApiKeyInput>;

export async function createAdminApiKey({
  userId,
  input,
}: {
  userId: string;
  input: AdminApiKeyInput;
}) {
  const secret = generateApiKeySecret();
  const encrypted = encryptApiKeySecret(secret, env.API_KEY_ENCRYPTION_KEY);
  const record = buildApiKeyRecord({
    secret,
    label: input.label,
    scopes: input.scopes,
  });

  const [created] = await db
    .insert(apiKeys)
    .values({
      ...record,
      description: input.description,
      expiresAt: input.expiresAt,
      encryptedSecret: encrypted.ciphertext,
      secretNonce: encrypted.nonce,
      secretAlgorithm: encrypted.algorithm,
      createdById: userId,
    })
    .returning();

  return {
    created,
    secret,
  };
}
