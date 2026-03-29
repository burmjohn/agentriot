import { describe, expect, it } from "vitest";
import {
  buildApiKeyRecord,
  generateApiKeySecret,
  hasApiKeyScope,
  verifyApiKeySecret,
} from "@/lib/ingestion/api-keys";

describe("API key helpers", () => {
  it("generates a stable AgentRiot key format", () => {
    const secret = generateApiKeySecret();

    expect(secret.startsWith("ar_live_")).toBe(true);
    expect(secret.length).toBeGreaterThan("ar_live_".length + 20);
  });

  it("hashes and verifies API key secrets without storing the raw secret", () => {
    const secret = "ar_live_test_secret_value";
    const record = buildApiKeyRecord({
      secret,
      label: "Seed publisher",
      scopes: ["content:write", "taxonomy:write"],
    });

    expect(record.keyPrefix).toBe(secret.slice(0, 16));
    expect(record.keyHash).not.toBe(secret);
    expect(record.scopes).toEqual(["content:write", "taxonomy:write"]);
    expect(verifyApiKeySecret(secret, record.keyHash)).toBe(true);
    expect(verifyApiKeySecret("ar_live_wrong_secret", record.keyHash)).toBe(false);
  });

  it("treats admin wildcard scope as a superset", () => {
    expect(hasApiKeyScope(["admin:*"], "content:write")).toBe(true);
    expect(hasApiKeyScope(["admin:*"], "taxonomy:write")).toBe(true);
  });

  it("requires exact scope when no wildcard exists", () => {
    expect(hasApiKeyScope(["content:write"], "content:write")).toBe(true);
    expect(hasApiKeyScope(["content:write"], "agents:write")).toBe(false);
  });
});
