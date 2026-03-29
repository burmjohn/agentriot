import { describe, expect, it } from "vitest";
import { normalizeApiKeyInput } from "@/lib/admin/api-key-input";

describe("normalizeApiKeyInput", () => {
  it("requires a label and at least one scope", () => {
    expect(() =>
      normalizeApiKeyInput({
        label: "",
        scopes: [],
      }),
    ).toThrow();
  });

  it("normalizes label, description, scopes, and expiry", () => {
    expect(
      normalizeApiKeyInput({
        label: " Automation publisher ",
        description: " Handles trusted writes ",
        scopes: ["content:write", "admin:*"],
        expiresAt: "2026-04-10T12:00:00.000Z",
      }),
    ).toMatchObject({
      label: "Automation publisher",
      description: "Handles trusted writes",
      scopes: ["content:write", "admin:*"],
      expiresAt: new Date("2026-04-10T12:00:00.000Z"),
    });
  });
});
