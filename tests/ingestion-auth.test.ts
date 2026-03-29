import { describe, expect, it } from "vitest";
import {
  evaluateApiKeyAccess,
  getApiKeyTokenFromHeaders,
} from "@/lib/ingestion/auth";

describe("ingestion auth helpers", () => {
  it("extracts bearer tokens from request headers", () => {
    expect(getApiKeyTokenFromHeaders(new Headers())).toBeNull();
    expect(
      getApiKeyTokenFromHeaders(
        new Headers({
          authorization: "Bearer ar_live_secret_token",
        }),
      ),
    ).toBe("ar_live_secret_token");
  });

  it("rejects revoked keys", () => {
    expect(
      evaluateApiKeyAccess({
        key: {
          keyHash: "hash",
          revokedAt: new Date(),
          expiresAt: null,
          scopes: ["content:write" as const],
        },
        providedSecret: "ar_live_secret_token",
        requiredScope: "content:write",
        verifySecret: () => true,
      }),
    ).toEqual({
      ok: false,
      status: 401,
      code: "api_key_revoked",
      message: "API key has been revoked.",
    });
  });

  it("rejects expired keys", () => {
    expect(
      evaluateApiKeyAccess({
        key: {
          keyHash: "hash",
          revokedAt: null,
          expiresAt: new Date("2020-01-01T00:00:00.000Z"),
          scopes: ["content:write" as const],
        },
        providedSecret: "ar_live_secret_token",
        requiredScope: "content:write",
        verifySecret: () => true,
        now: new Date("2026-01-01T00:00:00.000Z"),
      }),
    ).toEqual({
      ok: false,
      status: 401,
      code: "api_key_expired",
      message: "API key has expired.",
    });
  });

  it("rejects keys that do not carry the required scope", () => {
    expect(
      evaluateApiKeyAccess({
        key: {
          keyHash: "hash",
          revokedAt: null,
          expiresAt: null,
          scopes: ["taxonomy:write" as const],
        },
        providedSecret: "ar_live_secret_token",
        requiredScope: "content:write",
        verifySecret: () => true,
      }),
    ).toEqual({
      ok: false,
      status: 403,
      code: "insufficient_scope",
      message: "API key does not grant the required scope.",
    });
  });

  it("accepts valid keys with the required scope", () => {
    const key = {
      id: "key-1",
      keyHash: "hash",
      revokedAt: null,
      expiresAt: null,
      scopes: ["content:write" as const],
    };

    expect(
      evaluateApiKeyAccess({
        key,
        providedSecret: "ar_live_secret_token",
        requiredScope: "content:write",
        verifySecret: () => true,
      }),
    ).toEqual({
      ok: true,
      key,
    });
  });
});
