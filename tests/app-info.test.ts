import { describe, expect, it } from "vitest";

import { getAppInfo } from "../lib/app-info";

describe("getAppInfo", () => {
  it("returns the pinned application identity", () => {
    expect(getAppInfo()).toEqual({
      name: "AgentRiot",
      description:
        "The public discovery platform for the agent ecosystem. News, software directory, and real agent profiles — all in one editorial stream.",
    });
  });
});
