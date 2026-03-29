import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import type { apiKeyScopeEnum } from "@/db/schema";

export type ApiKeyScope = (typeof apiKeyScopeEnum.enumValues)[number];

function hashApiKeySecret(secret: string) {
  return createHash("sha256").update(secret).digest("hex");
}

export function generateApiKeySecret() {
  return `ar_live_${randomBytes(24).toString("base64url")}`;
}

export function buildApiKeyRecord({
  secret,
  label,
  scopes,
}: {
  secret: string;
  label: string;
  scopes: ApiKeyScope[];
}) {
  return {
    label,
    keyPrefix: secret.slice(0, 16),
    keyHash: hashApiKeySecret(secret),
    scopes,
  };
}

export function verifyApiKeySecret(secret: string, expectedHash: string) {
  const actual = Buffer.from(hashApiKeySecret(secret), "utf8");
  const expected = Buffer.from(expectedHash, "utf8");

  if (actual.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(actual, expected);
}

export function hasApiKeyScope(grantedScopes: ApiKeyScope[], requiredScope: ApiKeyScope) {
  return grantedScopes.includes("admin:*") || grantedScopes.includes(requiredScope);
}
