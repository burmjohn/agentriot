import { describe, expect, it } from "vitest";
import { buildPageMetadata } from "@/lib/seo/metadata";

describe("buildPageMetadata", () => {
  it("builds title, description, and canonical from page input", () => {
    expect(
      buildPageMetadata({
        title: "Claude Code",
        description: "Repo-aware coding agent for agentic workflows.",
        path: "/agents/claude-code",
      }),
    ).toMatchObject({
      title: "Claude Code",
      description: "Repo-aware coding agent for agentic workflows.",
      alternates: {
        canonical: "/agents/claude-code",
      },
      openGraph: {
        title: "Claude Code",
        description: "Repo-aware coding agent for agentic workflows.",
        url: "/agents/claude-code",
      },
    });
  });

  it("supports canonical and image overrides for rich detail pages", () => {
    expect(
      buildPageMetadata({
        title: "What Changed This Week in Coding Agents",
        description: "Weekly signal for agentic coders.",
        path: "/articles/what-changed-this-week-in-coding-agents",
        canonicalUrl: "https://agentriot.com/articles/custom-canonical",
        imageUrl: "https://agentriot.com/og/weekly.png",
      }),
    ).toMatchObject({
      alternates: {
        canonical: "https://agentriot.com/articles/custom-canonical",
      },
      openGraph: {
        url: "https://agentriot.com/articles/custom-canonical",
        images: [{ url: "https://agentriot.com/og/weekly.png" }],
      },
      twitter: {
        images: ["https://agentriot.com/og/weekly.png"],
      },
    });
  });

  it("falls back to a default description when none is supplied", () => {
    expect(
      buildPageMetadata({
        title: "Prompt library",
        path: "/prompts",
      }).description,
    ).toBe("Track what changed in AI. Find what to use next.");
  });
});
