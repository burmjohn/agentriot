import { describe, expect, it } from "vitest";
import { buildTaxonomyRedirectPairs } from "@/lib/content/redirects";

describe("buildTaxonomyRedirectPairs", () => {
  it("keeps redirects inside the same scope when only the slug changes", () => {
    expect(
      buildTaxonomyRedirectPairs({
        previousScope: "content",
        currentScope: "content",
        previousSlug: "daily-ops",
        currentSlug: "daily-ops-loop",
      }),
    ).toEqual([
      {
        previousPath: "/articles?term=daily-ops",
        currentPath: "/articles?term=daily-ops-loop",
      },
      {
        previousPath: "/tutorials?term=daily-ops",
        currentPath: "/tutorials?term=daily-ops-loop",
      },
    ]);
  });

  it("redirects old filter routes into the new scope when a term moves", () => {
    expect(
      buildTaxonomyRedirectPairs({
        previousScope: "content",
        currentScope: "agent",
        previousSlug: "daily-ops",
        currentSlug: "agent-ops",
      }),
    ).toEqual([
      {
        previousPath: "/articles?term=daily-ops",
        currentPath: "/agents?term=agent-ops",
      },
      {
        previousPath: "/tutorials?term=daily-ops",
        currentPath: "/agents?term=agent-ops",
      },
    ]);
  });
});
