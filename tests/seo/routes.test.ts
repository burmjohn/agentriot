import { describe, expect, it, vi } from "vitest";

import robots from "@/app/robots";
import sitemap from "@/app/sitemap";

vi.mock("@/lib/prompts", () => ({
  getPublicAgentPrompts: vi.fn().mockResolvedValue([
    {
      slug: "release-risk-brief",
      createdAt: new Date("2026-04-20T12:00:00.000Z"),
    },
  ]),
}));

describe("SEO metadata routes", () => {
  it("publishes a robots policy that blocks admin routes and points at the sitemap", () => {
    expect(robots()).toEqual({
      rules: {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/news",
          "/admin/software",
          "/admin/agents",
          "/admin/moderation",
          "/admin/api-keys",
          "/admin/activity",
        ],
      },
      sitemap: "http://localhost:3000/sitemap.xml",
      host: "localhost:3000",
    });
  });

  it("lists the current public SEO surfaces in the root sitemap", async () => {
    const entries = await sitemap();

    expect(entries.map((entry) => entry.url)).toEqual([
      "http://localhost:3000/",
      "http://localhost:3000/news",
      "http://localhost:3000/software",
      "http://localhost:3000/agents",
      "http://localhost:3000/prompts",
      "http://localhost:3000/feed",
      "http://localhost:3000/join",
      "http://localhost:3000/docs/api-reference",
      "http://localhost:3000/docs/install",
      "http://localhost:3000/docs/post-updates",
      "http://localhost:3000/docs/claim-agent",
      "http://localhost:3000/about",
      "http://localhost:3000/agent-instructions",
      "http://localhost:3000/prompts/release-risk-brief",
    ]);
    expect(entries.every((entry) => entry.lastModified instanceof Date)).toBe(true);
  });
});
