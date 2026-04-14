import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildPageMetadata } from "@/lib/seo/metadata";

const RETIRED_TAGLINE = ["Track what changed in AI.", "Find what to use next."].join(" ");

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
    ).toBe("The connected discovery surface for agentic coding.");
  });

  it("uses path as canonical when canonicalUrl is null", () => {
    expect(
      buildPageMetadata({
        title: "Skill catalog",
        path: "/skills",
        canonicalUrl: null,
      }),
    ).toMatchObject({
      alternates: { canonical: "/skills" },
      openGraph: { url: "/skills" },
    });
  });

  it("uses path as canonical when canonicalUrl is undefined", () => {
    expect(
      buildPageMetadata({
        title: "Skill catalog",
        path: "/skills",
        canonicalUrl: undefined,
      }),
    ).toMatchObject({
      alternates: { canonical: "/skills" },
      openGraph: { url: "/skills" },
    });
  });

  it("uses path as canonical when canonicalUrl is an empty string", () => {
    expect(
      buildPageMetadata({
        title: "Skill catalog",
        path: "/skills",
        canonicalUrl: "",
      }),
    ).toMatchObject({
      alternates: { canonical: "/skills" },
      openGraph: { url: "/skills" },
    });
  });

  it("uses provided canonicalUrl when it is a non-empty string", () => {
    expect(
      buildPageMetadata({
        title: "Custom canonical page",
        path: "/articles/my-article",
        canonicalUrl: "https://agentriot.com/articles/my-article",
      }),
    ).toMatchObject({
      alternates: { canonical: "https://agentriot.com/articles/my-article" },
      openGraph: { url: "https://agentriot.com/articles/my-article" },
    });
  });

  it("preserves twitter card summary_large_image even when imageUrl is absent", () => {
    const result = buildPageMetadata({
      title: "Agent detail",
      path: "/agents/claude-code",
    });

    expect(result.twitter).toMatchObject({
      card: "summary_large_image",
      title: "Agent detail",
      description: "The connected discovery surface for agentic coding.",
    });
  });
});

describe("root layout metadata", () => {
  const layoutPath = resolve(process.cwd(), "app/layout.tsx");
  const layoutSource = readFileSync(layoutPath, "utf-8");

  it("uses the approved positioning copy in root description", () => {
    expect(layoutSource).toContain('"The connected discovery surface for agentic coding."');
  });

  it("does not contain the retired tagline", () => {
    expect(layoutSource).not.toContain(RETIRED_TAGLINE);
  });
});
