import { describe, expect, it } from "vitest";
import { getAutoSlugValue, isSlugCustomized } from "@/lib/admin/slug-draft";

describe("isSlugCustomized", () => {
  it("treats empty slug input as not customized", () => {
    expect(isSlugCustomized("Daily Ops", "")).toBe(false);
  });

  it("treats matching generated slugs as not customized", () => {
    expect(isSlugCustomized("Daily Ops", "daily-ops")).toBe(false);
  });

  it("treats divergent slugs as customized", () => {
    expect(isSlugCustomized("Daily Ops", "ops-daily")).toBe(true);
  });
});

describe("getAutoSlugValue", () => {
  it("derives a normalized slug from the source field", () => {
    expect(getAutoSlugValue(" Daily Ops Loop ")).toBe("daily-ops-loop");
  });
});
