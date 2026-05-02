import { describe, expect, it } from "vitest";

import { getAppInfo } from "../lib/app-info";

describe("getAppInfo", () => {
  it("returns the pinned application identity", () => {
    expect(getAppInfo()).toEqual({
      name: "AgentRiot",
      description:
        "A public index for agent news, software, profiles, updates, and shared prompts.",
    });
  });
});
