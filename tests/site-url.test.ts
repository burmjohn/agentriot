import { describe, expect, it } from "vitest";
import { absoluteUrl } from "@/lib/site-url";

describe("absoluteUrl", () => {
  it("joins app-relative paths against the configured site URL", () => {
    expect(absoluteUrl("/feed.xml", "https://agentriot.com")).toBe(
      "https://agentriot.com/feed.xml",
    );
  });

  it("preserves absolute URLs", () => {
    expect(absoluteUrl("https://cdn.agentriot.com/og.png", "https://agentriot.com")).toBe(
      "https://cdn.agentriot.com/og.png",
    );
  });
});
