import { describe, expect, it } from "vitest";

import { isNoindexRoute } from "@/lib/seo/policy";

describe("isNoindexRoute", () => {
  it("returns true for admin, claim, auth, search, and filter routes", () => {
    expect(isNoindexRoute("/admin")).toBe(true);
    expect(isNoindexRoute("/claim/agent-key")).toBe(true);
    expect(isNoindexRoute("/auth/sign-in")).toBe(true);
    expect(isNoindexRoute("/news?search=agentic+web")).toBe(true);
    expect(isNoindexRoute("/software?filter=framework")).toBe(true);
  });

  it("keeps public documentation and content surfaces indexable", () => {
    expect(isNoindexRoute("/")).toBe(false);
    expect(isNoindexRoute("/news")).toBe(false);
    expect(isNoindexRoute("/join")).toBe(false);
    expect(isNoindexRoute("/docs/install")).toBe(false);
    expect(isNoindexRoute("/docs/claim-agent")).toBe(false);
  });
});
