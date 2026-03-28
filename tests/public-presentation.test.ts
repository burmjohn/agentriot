import { describe, expect, it } from "vitest";
import {
  getPublicTaxonomyHref,
  groupTaxonomyTermsByKind,
} from "@/lib/public/presentation";

describe("groupTaxonomyTermsByKind", () => {
  it("groups shared taxonomy terms in stable kind order", () => {
    expect(
      groupTaxonomyTermsByKind([
        {
          id: "3",
          slug: "automation",
          label: "Automation",
          kind: "tag",
          scope: "skill",
        },
        { id: "1", slug: "coding", label: "Coding", kind: "type", scope: "agent" },
        {
          id: "2",
          slug: "agents",
          label: "Agents",
          kind: "category",
          scope: "content",
        },
        { id: "4", slug: "research", label: "Research", kind: "tag", scope: "agent" },
      ]),
    ).toEqual([
      {
        kind: "category",
        label: "Category",
        terms: [
          {
            id: "2",
            slug: "agents",
            label: "Agents",
            kind: "category",
            scope: "content",
          },
        ],
      },
      {
        kind: "tag",
        label: "Tags",
        terms: [
          {
            id: "3",
            slug: "automation",
            label: "Automation",
            kind: "tag",
            scope: "skill",
          },
          {
            id: "4",
            slug: "research",
            label: "Research",
            kind: "tag",
            scope: "agent",
          },
        ],
      },
      {
        kind: "type",
        label: "Types",
        terms: [
          { id: "1", slug: "coding", label: "Coding", kind: "type", scope: "agent" },
        ],
      },
    ]);
  });

  it("maps taxonomy terms to their public collection routes", () => {
    expect(
      getPublicTaxonomyHref({
        id: "1",
        slug: "coding-agents",
        label: "Coding Agents",
        kind: "category",
        scope: "content",
      }),
    ).toBe("/articles?term=coding-agents");
    expect(
      getPublicTaxonomyHref({
        id: "2",
        slug: "research",
        label: "Research",
        kind: "tag",
        scope: "agent",
      }),
    ).toBe("/agents?term=research");
    expect(
      getPublicTaxonomyHref({
        id: "3",
        slug: "evaluation",
        label: "Evaluation",
        kind: "category",
        scope: "prompt",
      }),
    ).toBe("/prompts?term=evaluation");
    expect(
      getPublicTaxonomyHref({
        id: "4",
        slug: "automation",
        label: "Automation",
        kind: "category",
        scope: "skill",
      }),
    ).toBe("/skills?term=automation");
  });
});
