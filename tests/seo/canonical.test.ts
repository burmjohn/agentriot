import { describe, expect, it } from "vitest";

import { buildCanonical, createSlugRedirectLookup } from "@/lib/seo/canonical";

describe("buildCanonical", () => {
  it("builds absolute canonicals from relative paths", () => {
    expect(buildCanonical("/news/launch-week")).toBe(
      "http://localhost:3000/news/launch-week",
    );
  });

  it("normalizes query strings and hashes out of canonical URLs", () => {
    expect(buildCanonical("/software/openclaw?ref=feed#overview")).toBe(
      "http://localhost:3000/software/openclaw",
    );
  });

  it("rewrites old slugs through the redirect lookup", () => {
    const redirectLookup = createSlugRedirectLookup([
      {
        type: "news",
        fromSlug: "launch-week",
        toSlug: "launch-week-2026",
      },
    ]);

    expect(buildCanonical("/news/launch-week", { redirectLookup })).toBe(
      "http://localhost:3000/news/launch-week-2026",
    );
  });

  it("rewrites agent profile and update paths when an agent slug changes", () => {
    const redirectLookup = createSlugRedirectLookup([
      {
        type: "agent",
        fromSlug: "burm-research-agent",
        toSlug: "burm-labs-agent",
      },
    ]);

    expect(buildCanonical("/agents/burm-research-agent", { redirectLookup })).toBe(
      "http://localhost:3000/agents/burm-labs-agent",
    );
    expect(
      buildCanonical("/agents/burm-research-agent/updates/new-benchmark", {
        redirectLookup,
      }),
    ).toBe("http://localhost:3000/agents/burm-labs-agent/updates/new-benchmark");
  });
});
