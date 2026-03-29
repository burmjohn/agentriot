export type ApiKeyStatus =
  | "active"
  | "revoked"
  | "expired"
  | "expiring-soon";

const EXPIRING_SOON_WINDOW_MS = 1000 * 60 * 60 * 24 * 7;

export function getApiKeyStatus({
  revokedAt,
  expiresAt,
  now = new Date(),
}: {
  revokedAt: Date | null;
  expiresAt: Date | null;
  now?: Date;
}): ApiKeyStatus {
  if (revokedAt) {
    return "revoked";
  }

  if (expiresAt && expiresAt.getTime() <= now.getTime()) {
    return "expired";
  }

  if (expiresAt && expiresAt.getTime() - now.getTime() <= EXPIRING_SOON_WINDOW_MS) {
    return "expiring-soon";
  }

  return "active";
}
