import { describe, expect, it } from "vitest";
import {
  buildRedirectRecords,
  buildRoutePath,
  nextAvailableSlug,
  nextAvailableSlugExcept,
  slugify,
} from "@/lib/content/slug-policy";

describe("slugify", () => {
  it("normalizes punctuation, casing, and spacing", () => {
    expect(slugify(" Claude Code: Repo-Aware Workflows! ")).toBe(
      "claude-code-repo-aware-workflows",
    );
  });

  it("collapses repeated separators", () => {
    expect(slugify("agent---news___weekly")).toBe("agent-news-weekly");
  });
});

describe("nextAvailableSlug", () => {
  it("returns the desired slug when unused", () => {
    expect(nextAvailableSlug("claude-code", [])).toBe("claude-code");
  });

  it("increments suffixes when the slug is already taken", () => {
    expect(
      nextAvailableSlug("claude-code", [
        "claude-code",
        "claude-code-2",
        "claude-code-3",
      ]),
    ).toBe("claude-code-4");
  });
});

describe("nextAvailableSlugExcept", () => {
  it("keeps the slug when the only conflict is the current record", () => {
    expect(
      nextAvailableSlugExcept("claude-code", [
        "claude-code",
        "paperclip",
      ], "claude-code"),
    ).toBe("claude-code");
  });

  it("bumps the slug when another record already owns it", () => {
    expect(
      nextAvailableSlugExcept("claude-code", [
        "claude-code",
        "claude-code-2",
      ], "claude-code-old"),
    ).toBe("claude-code-3");
  });
});

describe("buildRoutePath", () => {
  it("builds canonical public paths by route scope", () => {
    expect(buildRoutePath("agent", "claude-code")).toBe("/agents/claude-code");
    expect(buildRoutePath("tutorial", "build-an-agent-news-pipeline")).toBe(
      "/tutorials/build-an-agent-news-pipeline",
    );
  });
});

describe("buildRedirectRecords", () => {
  it("maps previous slugs to the current canonical path", () => {
    expect(
      buildRedirectRecords({
        routeType: "prompt",
        currentSlug: "repo-evaluator",
        previousSlugs: ["repo-auditor", "repository-evaluator", "repo-evaluator"],
      }),
    ).toEqual([
      {
        sourcePath: "/prompts/repo-auditor",
        targetPath: "/prompts/repo-evaluator",
        isPermanent: true,
      },
      {
        sourcePath: "/prompts/repository-evaluator",
        targetPath: "/prompts/repo-evaluator",
        isPermanent: true,
      },
    ]);
  });
});
