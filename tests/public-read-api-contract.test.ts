import { describe, expect, it } from "vitest";
import {
  buildCollectionEnvelope,
  buildDetailEnvelope,
  buildErrorEnvelope,
  normalizeSearchQuery,
  parseTaxonomyScope,
} from "@/lib/api/public-read";

describe("public read API helpers", () => {
  it("builds stable collection envelopes with versioned metadata", () => {
    expect(
      buildCollectionEnvelope({
        data: [{ slug: "claude-code" }],
        entity: "agents",
        query: { term: "coding-agent" },
      }),
    ).toEqual({
      data: [{ slug: "claude-code" }],
      meta: {
        count: 1,
        entity: "agents",
        query: { term: "coding-agent" },
        version: "v1",
      },
    });
  });

  it("builds a detail envelope with versioned metadata", () => {
    expect(
      buildDetailEnvelope({
        data: { slug: "claude-code" },
        entity: "agent",
      }),
    ).toEqual({
      data: { slug: "claude-code" },
      meta: {
        entity: "agent",
        version: "v1",
      },
    });
  });

  it("builds stable error envelopes", () => {
    expect(
      buildErrorEnvelope({
        code: "not_found",
        message: "Agent not found.",
        details: { slug: "missing-agent" },
      }),
    ).toEqual({
      error: {
        code: "not_found",
        details: { slug: "missing-agent" },
        message: "Agent not found.",
      },
      meta: {
        version: "v1",
      },
    });
  });

  it("normalizes search queries and strips empty input", () => {
    expect(normalizeSearchQuery("   repo context   ")).toBe("repo context");
    expect(normalizeSearchQuery("   ")).toBeNull();
  });

  it("validates taxonomy scopes", () => {
    expect(parseTaxonomyScope("agent")).toBe("agent");
    expect(parseTaxonomyScope("content")).toBe("content");
    expect(parseTaxonomyScope("garbage")).toBeNull();
    expect(parseTaxonomyScope(null)).toBeNull();
  });
});
