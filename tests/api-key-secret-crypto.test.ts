import { describe, expect, it } from "vitest";
import {
  decryptApiKeySecret,
  encryptApiKeySecret,
} from "@/lib/ingestion/secret-crypto";

describe("api key secret crypto", () => {
  it("round-trips an API key secret", () => {
    const encrypted = encryptApiKeySecret(
      "ar_live_secret_value",
      "12345678901234567890123456789012",
    );

    expect(encrypted.ciphertext).not.toContain("ar_live_secret_value");
    expect(
      decryptApiKeySecret(encrypted, "12345678901234567890123456789012"),
    ).toBe("ar_live_secret_value");
  });
});
