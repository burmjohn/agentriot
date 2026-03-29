import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { apiKeys } from "@/db/schema";
import { hasApiKeyScope, type ApiKeyScope, verifyApiKeySecret } from "@/lib/ingestion/api-keys";

type ApiKeyRecord = {
  id?: string;
  keyHash: string;
  revokedAt: Date | null;
  expiresAt: Date | null;
  scopes: ApiKeyScope[];
};

type AccessFailure = {
  ok: false;
  status: 401 | 403;
  code: string;
  message: string;
};

type AccessSuccess = {
  ok: true;
  key: ApiKeyRecord;
};

export function getApiKeyTokenFromHeaders(headers: Headers) {
  const authorization = headers.get("authorization")?.trim();

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  const token = authorization.slice("Bearer ".length).trim();
  return token || null;
}

export function evaluateApiKeyAccess({
  key,
  providedSecret,
  requiredScope,
  verifySecret = verifyApiKeySecret,
  now = new Date(),
}: {
  key: ApiKeyRecord | null;
  providedSecret: string;
  requiredScope: ApiKeyScope;
  verifySecret?: (secret: string, expectedHash: string) => boolean;
  now?: Date;
}): AccessFailure | AccessSuccess {
  if (!key || !verifySecret(providedSecret, key.keyHash)) {
    return {
      ok: false,
      status: 401,
      code: "invalid_api_key",
      message: "API key is invalid.",
    };
  }

  if (key.revokedAt) {
    return {
      ok: false,
      status: 401,
      code: "api_key_revoked",
      message: "API key has been revoked.",
    };
  }

  if (key.expiresAt && key.expiresAt.getTime() <= now.getTime()) {
    return {
      ok: false,
      status: 401,
      code: "api_key_expired",
      message: "API key has expired.",
    };
  }

  if (!hasApiKeyScope(key.scopes, requiredScope)) {
    return {
      ok: false,
      status: 403,
      code: "insufficient_scope",
      message: "API key does not grant the required scope.",
    };
  }

  return {
    ok: true,
    key,
  };
}

export async function authenticateIngestionRequest({
  headers,
  requiredScope,
}: {
  headers: Headers;
  requiredScope: ApiKeyScope;
}): Promise<AccessFailure | AccessSuccess> {
  const token = getApiKeyTokenFromHeaders(headers);

  if (!token) {
    return {
      ok: false,
      status: 401,
      code: "missing_api_key",
      message: "API key is required.",
    };
  }

  const keyPrefix = token.slice(0, 16);
  const [record] = await db
    .select({
      id: apiKeys.id,
      keyHash: apiKeys.keyHash,
      revokedAt: apiKeys.revokedAt,
      expiresAt: apiKeys.expiresAt,
      scopes: apiKeys.scopes,
    })
    .from(apiKeys)
    .where(eq(apiKeys.keyPrefix, keyPrefix))
    .limit(1);

  const access = evaluateApiKeyAccess({
    key: record ?? null,
    providedSecret: token,
    requiredScope,
  });

  if (!access.ok || !record?.id) {
    return access;
  }

  const forwardedFor = headers.get("x-forwarded-for");
  const lastUsedIp = forwardedFor?.split(",")[0]?.trim() || null;

  await db
    .update(apiKeys)
    .set({
      lastUsedAt: new Date(),
      lastUsedIp,
    })
    .where(and(eq(apiKeys.id, record.id), eq(apiKeys.keyPrefix, keyPrefix)));

  return access;
}
