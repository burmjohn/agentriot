import { describe, expect, it } from "vitest";
import { normalizeTaxonomyInput } from "@/lib/admin/taxonomy-input";

describe("normalizeTaxonomyInput", () => {
  it("trims values and derives a slug from the label", () => {
    expect(
      normalizeTaxonomyInput({
        scope: "content",
        kind: "tag",
        label: "  Coding Agents  ",
        description: "  things about coding agents ",
      }),
    ).toEqual({
      scope: "content",
      kind: "tag",
      label: "Coding Agents",
      slug: "coding-agents",
      description: "things about coding agents",
    });
  });

  it("honors a slug override when supplied", () => {
    expect(
      normalizeTaxonomyInput({
        scope: "prompt",
        kind: "category",
        label: "Research",
        slug: "research-prompts",
      }),
    ).toMatchObject({
      slug: "research-prompts",
    });
  });

  it("normalizes type terms for the shared taxonomy surface", () => {
    expect(
      normalizeTaxonomyInput({
        scope: "agent",
        kind: "type",
        label: " Coding Agent ",
      }),
    ).toEqual({
      scope: "agent",
      kind: "type",
      label: "Coding Agent",
      slug: "coding-agent",
      description: null,
    });
  });
});
