import { beforeEach, describe, expect, it, vi } from "vitest";

const db = {
  insert: vi.fn(),
};

vi.mock("@/db", () => ({
  db,
}));

vi.mock("@/lib/env", () => ({
  env: {
    API_KEY_ENCRYPTION_KEY: "12345678901234567890123456789012",
  },
}));

describe("API key admin helpers", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("marks revoked keys before expiry state", async () => {
    const { getApiKeyStatus } = await import("@/lib/admin/api-key-status");

    expect(
      getApiKeyStatus({
        revokedAt: new Date("2026-03-28T00:00:00.000Z"),
        expiresAt: new Date("2030-01-01T00:00:00.000Z"),
      }),
    ).toBe("revoked");
  });

  it("creates an encrypted key record and returns the clear secret for the success state", async () => {
    const returning = vi.fn().mockResolvedValue([
      {
        id: "key-1",
        label: "Automation publisher",
        keyHash: "hashed",
        keyPrefix: "ar_live_secret_1",
      },
    ]);
    const values = vi.fn().mockReturnValue({ returning });
    db.insert.mockReturnValue({ values });

    const { createAdminApiKey } = await import("@/lib/admin/api-key-admin");

    const result = await createAdminApiKey({
      userId: "user-1",
      input: {
        label: "Automation publisher",
        description: "Trusted machine writer",
        scopes: ["content:write", "admin:*"],
        expiresAt: new Date("2026-04-10T12:00:00.000Z"),
      },
    });

    expect(result.secret.startsWith("ar_live_")).toBe(true);
    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({
        label: "Automation publisher",
        description: "Trusted machine writer",
        scopes: ["content:write", "admin:*"],
        encryptedSecret: expect.any(String),
        secretNonce: expect.any(String),
        secretAlgorithm: "aes-256-gcm",
        createdById: "user-1",
      }),
    );
  });
});
