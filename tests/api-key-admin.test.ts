import { encryptApiKeySecret } from "@/lib/ingestion/secret-crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const db = {
  insert: vi.fn(),
  query: {
    apiKeys: {
      findFirst: vi.fn(),
    },
  },
  update: vi.fn(),
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

  it("reveals the decrypted secret for an existing key", async () => {
    const encrypted = encryptApiKeySecret(
      "ar_live_secret_value",
      "12345678901234567890123456789012",
    );

    db.query.apiKeys.findFirst.mockResolvedValue({
      id: "key-1",
      encryptedSecret: encrypted.ciphertext,
      secretNonce: encrypted.nonce,
      secretAlgorithm: encrypted.algorithm,
    });

    const { revealAdminApiKey } = await import("@/lib/admin/api-key-admin");

    await expect(revealAdminApiKey("key-1")).resolves.toBe("ar_live_secret_value");
  });

  it("updates scopes and expiry for an existing key", async () => {
    const returning = vi.fn().mockResolvedValue([{ id: "key-1" }]);
    const where = vi.fn().mockReturnValue({ returning });
    const set = vi.fn().mockReturnValue({ where });
    db.update.mockReturnValue({ set });

    const { updateAdminApiKey } = await import("@/lib/admin/api-key-admin");

    await updateAdminApiKey({
      id: "key-1",
      input: {
        label: "Updated publisher",
        description: null,
        scopes: ["content:write"],
        expiresAt: new Date("2026-04-11T00:00:00.000Z"),
      },
    });

    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        label: "Updated publisher",
        scopes: ["content:write"],
        expiresAt: new Date("2026-04-11T00:00:00.000Z"),
      }),
    );
  });

  it("can revoke and reactivate a key", async () => {
    const returning = vi.fn().mockResolvedValue([{ id: "key-1" }]);
    const where = vi.fn().mockReturnValue({ returning });
    const set = vi.fn().mockReturnValue({ where });
    db.update.mockReturnValue({ set });

    const { reactivateAdminApiKey, revokeAdminApiKey } = await import(
      "@/lib/admin/api-key-admin"
    );

    await revokeAdminApiKey("key-1");
    expect(set).toHaveBeenCalledWith(expect.objectContaining({ revokedAt: expect.any(Date) }));

    set.mockClear();

    await reactivateAdminApiKey("key-1");
    expect(set).toHaveBeenCalledWith(expect.objectContaining({ revokedAt: null }));
  });
});
