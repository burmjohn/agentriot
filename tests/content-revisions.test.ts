import { describe, expect, it } from "vitest";
import {
  buildContentRestoreValues,
  buildContentRevisionValues,
  getChangedContentRevisionFields,
} from "@/lib/admin/content-revisions";

describe("buildContentRevisionValues", () => {
  it("captures a numbered snapshot of the content record", () => {
    const now = new Date("2026-03-28T12:00:00.000Z");
    const publishedAt = new Date("2026-03-28T09:30:00.000Z");
    const scheduledFor = new Date("2026-03-29T15:45:00.000Z");

    expect(
      buildContentRevisionValues({
        contentItem: {
          id: "content-1",
          kind: "article",
          subtype: "news",
          status: "published",
          title: "What Changed This Week in Coding Agents",
          slug: "what-changed-this-week-in-coding-agents",
          excerpt: "Weekly signal.",
          body: "Body copy.",
          heroImageUrl: "https://agentriot.com/og/weekly.png",
          canonicalUrl: "https://agentriot.com/articles/custom-canonical",
          seoTitle: "Weekly coding-agent signal",
          seoDescription: "Weekly description.",
          publishedAt,
          scheduledFor,
        },
        editedById: "user-1",
        revisionNumber: 3,
        createdAt: now,
      }),
    ).toMatchObject({
      contentItemId: "content-1",
      revisionNumber: 3,
      title: "What Changed This Week in Coding Agents",
      slug: "what-changed-this-week-in-coding-agents",
      kind: "article",
      subtype: "news",
      status: "published",
      excerpt: "Weekly signal.",
      body: "Body copy.",
      heroImageUrl: "https://agentriot.com/og/weekly.png",
      canonicalUrl: "https://agentriot.com/articles/custom-canonical",
      seoTitle: "Weekly coding-agent signal",
      seoDescription: "Weekly description.",
      publishedAt,
      scheduledFor,
      editedById: "user-1",
      createdAt: now,
    });
  });
});

describe("buildContentRestoreValues", () => {
  it("maps a revision snapshot back onto the editable content fields", () => {
    const publishedAt = new Date("2026-03-28T09:30:00.000Z");
    const scheduledFor = new Date("2026-03-29T15:45:00.000Z");

    expect(
      buildContentRestoreValues({
        id: "revision-1",
        contentItemId: "content-1",
        revisionNumber: 2,
        kind: "tutorial",
        subtype: "guide",
        status: "review",
        title: "Build an Agent News Pipeline",
        slug: "build-an-agent-news-pipeline",
        excerpt: "Pipeline overview.",
        body: "Detailed guide.",
        heroImageUrl: "https://agentriot.com/og/pipeline.png",
        canonicalUrl: "https://agentriot.com/tutorials/pipeline",
        seoTitle: "Pipeline SEO title",
        seoDescription: "Pipeline SEO description.",
        publishedAt,
        scheduledFor,
        editedById: "user-1",
        createdAt: new Date("2026-03-28T12:00:00.000Z"),
      }),
    ).toMatchObject({
      kind: "tutorial",
      subtype: "guide",
      status: "review",
      title: "Build an Agent News Pipeline",
      slug: "build-an-agent-news-pipeline",
      excerpt: "Pipeline overview.",
      body: "Detailed guide.",
      heroImageUrl: "https://agentriot.com/og/pipeline.png",
      canonicalUrl: "https://agentriot.com/tutorials/pipeline",
      seoTitle: "Pipeline SEO title",
      seoDescription: "Pipeline SEO description.",
      publishedAt,
      scheduledFor,
    });
  });
});

describe("getChangedContentRevisionFields", () => {
  it("summarizes the editable fields that differ from the current revision", () => {
    const currentRevision = {
      id: "revision-2",
      contentItemId: "content-1",
      revisionNumber: 2,
      kind: "article",
      subtype: "analysis",
      status: "published",
      title: "Current title",
      slug: "current-title",
      excerpt: "Current excerpt",
      body: "Current body",
      heroImageUrl: "https://agentriot.com/current.png",
      canonicalUrl: null,
      seoTitle: "Current SEO",
      seoDescription: "Current description",
      publishedAt: new Date("2026-03-28T09:30:00.000Z"),
      scheduledFor: null,
      editedById: "user-1",
      createdAt: new Date("2026-03-28T12:00:00.000Z"),
    } as const;

    const previousRevision = {
      ...currentRevision,
      id: "revision-1",
      revisionNumber: 1,
      status: "review",
      title: "Previous title",
      body: "Previous body",
      seoTitle: null,
      publishedAt: null,
    } as const;

    expect(getChangedContentRevisionFields(previousRevision, currentRevision)).toEqual([
      "Status",
      "Title",
      "Body",
      "SEO title",
      "Published at",
    ]);
  });
});
