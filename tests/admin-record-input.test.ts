import { describe, expect, it } from "vitest";
import {
  normalizeAgentInput,
  normalizeContentInput,
  normalizePromptInput,
  normalizeSkillInput,
} from "@/lib/admin/record-input";

describe("normalizeContentInput", () => {
  it("derives a slug and normalizes editorial metadata fields", () => {
    const publishedAt = "2026-03-28T09:30";
    const scheduledFor = "2026-03-29T15:45";

    expect(
      normalizeContentInput({
        kind: "tutorial",
        title: " Build an Agent News Pipeline ",
        subtype: "guide",
        status: "draft",
        excerpt: "  Tight daily workflow  ",
        body: "  body copy  ",
        heroImageUrl: " https://agentriot.com/og/news.png ",
        canonicalUrl: " https://agentriot.com/tutorials/custom-canonical ",
        seoTitle: "  Better SEO title  ",
        seoDescription: "  Better SEO description  ",
        publishedAt,
        scheduledFor,
      }),
    ).toMatchObject({
      kind: "tutorial",
      title: "Build an Agent News Pipeline",
      slug: "build-an-agent-news-pipeline",
      excerpt: "Tight daily workflow",
      body: "body copy",
      subtype: "guide",
      status: "draft",
      heroImageUrl: "https://agentriot.com/og/news.png",
      canonicalUrl: "https://agentriot.com/tutorials/custom-canonical",
      seoTitle: "Better SEO title",
      seoDescription: "Better SEO description",
      publishedAt: new Date(publishedAt),
      scheduledFor: new Date(scheduledFor),
    });
  });

  it("backfills publishedAt when publishing without a timestamp", () => {
    const normalized = normalizeContentInput({
      kind: "article",
      title: "Ship it",
      status: "published",
    });

    expect(normalized.publishedAt).toBeInstanceOf(Date);
    expect(normalized.scheduledFor).toBeNull();
  });
});

describe("normalizeAgentInput", () => {
  it("uses a custom slug when supplied", () => {
    expect(
      normalizeAgentInput({
        title: "Claude Code",
        slug: "claude-code-pro",
        shortDescription: "Repo-aware coding agent",
        status: "published",
      }),
    ).toMatchObject({
      title: "Claude Code",
      slug: "claude-code-pro",
      status: "published",
    });
  });
});

describe("normalizePromptInput", () => {
  it("requires a prompt body and derives a slug", () => {
    expect(
      normalizePromptInput({
        title: "Repository evaluator",
        shortDescription: "Audit a repo fast",
        promptBody: "Inspect the repository and explain the risks.",
        status: "draft",
      }),
    ).toMatchObject({
      slug: "repository-evaluator",
      promptBody: "Inspect the repository and explain the risks.",
    });
  });
});

describe("normalizeSkillInput", () => {
  it("normalizes optional URLs and descriptions", () => {
    expect(
      normalizeSkillInput({
        title: "Issue triage",
        shortDescription: "Sort issues",
        websiteUrl: " https://agentriot.com/skills/issue-triage ",
        githubUrl: "",
        status: "draft",
      }),
    ).toMatchObject({
      slug: "issue-triage",
      websiteUrl: "https://agentriot.com/skills/issue-triage",
      githubUrl: null,
    });
  });
});
