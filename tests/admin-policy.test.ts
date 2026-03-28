import { describe, expect, it } from "vitest";
import {
  isAdminEmailAllowed,
  parseAdminEmailAllowlist,
} from "@/lib/auth/admin-policy";

describe("parseAdminEmailAllowlist", () => {
  it("returns an empty list when the allowlist is missing", () => {
    expect(parseAdminEmailAllowlist(undefined)).toEqual([]);
  });

  it("normalizes case, trims whitespace, and removes duplicates", () => {
    expect(
      parseAdminEmailAllowlist(
        "  Admin@AgentRiot.com, editor@example.com ,admin@agentriot.com,, ",
      ),
    ).toEqual(["admin@agentriot.com", "editor@example.com"]);
  });
});

describe("isAdminEmailAllowed", () => {
  it("fails closed when no allowlist entries exist", () => {
    expect(isAdminEmailAllowed("admin@agentriot.com", [])).toBe(false);
  });

  it("matches allowed emails case-insensitively", () => {
    expect(
      isAdminEmailAllowed("Admin@AgentRiot.com", ["admin@agentriot.com"]),
    ).toBe(true);
  });
});
