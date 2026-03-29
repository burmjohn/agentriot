import { eq } from "drizzle-orm";
import { db } from "@/db";
import { apiKeys } from "@/db/schema";
import type { normalizeApiKeyInput } from "@/lib/admin/api-key-input";
import { env } from "@/lib/env";
import { buildApiKeyRecord, generateApiKeySecret } from "@/lib/ingestion/api-keys";
import {
  decryptApiKeySecret,
  encryptApiKeySecret,
} from "@/lib/ingestion/secret-crypto";

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

export async function revealAdminApiKey(id: string) {
  const record = await db.query.apiKeys.findFirst({
    where: eq(apiKeys.id, id),
  });

  if (!record?.encryptedSecret || !record.secretNonce || !record.secretAlgorithm) {
    throw new Error("API key secret is not available for reveal.");
  }

  return decryptApiKeySecret(
    {
      algorithm: record.secretAlgorithm as "aes-256-gcm",
      ciphertext: record.encryptedSecret,
      nonce: record.secretNonce,
    },
    env.API_KEY_ENCRYPTION_KEY,
  );
}

export async function updateAdminApiKey({
  id,
  input,
}: {
  id: string;
  input: AdminApiKeyInput;
}) {
  const [updated] = await db
    .update(apiKeys)
    .set({
      label: input.label,
      description: input.description,
      scopes: input.scopes,
      expiresAt: input.expiresAt,
    })
    .where(eq(apiKeys.id, id))
    .returning();

  return updated;
}

export async function revokeAdminApiKey(id: string) {
  const [updated] = await db
    .update(apiKeys)
    .set({
      revokedAt: new Date(),
    })
    .where(eq(apiKeys.id, id))
    .returning();

  return updated;
}

export async function reactivateAdminApiKey(id: string) {
  const [updated] = await db
    .update(apiKeys)
    .set({
      revokedAt: null,
    })
    .where(eq(apiKeys.id, id))
    .returning();

  return updated;
}
