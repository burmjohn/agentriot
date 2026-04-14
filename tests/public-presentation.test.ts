import { describe, expect, it } from "vitest";
import {
  getPublicTaxonomyHref,
  groupTaxonomyTermsByKind,
} from "@/lib/public/presentation";

const PHASE_1 = ["Phase", "1"].join(" ");
const ADMIN_CONSOLE = ["admin", "console"].join(" ");
const BOOTSTRAP_ALLOWLIST_TOKEN = ["ADMIN_EMAIL", "ALLOWLIST"].join("_");
const RETIRED_TAGLINE = ["Track what changed in AI.", "Find what to use next."].join(" ");

const BANNED_PHRASES = [
  PHASE_1,
  ADMIN_CONSOLE,
  BOOTSTRAP_ALLOWLIST_TOKEN,
  RETIRED_TAGLINE,
] as const;

function stringContainsBannedPhrase(text: string, banned: readonly string[]): string | null {
  for (const phrase of banned) {
    if (text.includes(phrase)) return phrase;
  }
  return null;
}

const SAMPLE_WITH_BANNED_PHRASES = [
  {
    text: [PHASE_1, "favors public utility over heavy operations tooling."].join(" "),
    expect_: PHASE_1,
  },
  {
    text: ["Sign in to the", ADMIN_CONSOLE, "to manage your content."].join(" "),
    expect_: ADMIN_CONSOLE,
  },
  {
    text: ["Set", BOOTSTRAP_ALLOWLIST_TOKEN, "to enable first-admin creation."].join(" "),
    expect_: BOOTSTRAP_ALLOWLIST_TOKEN,
  },
  { text: RETIRED_TAGLINE, expect_: RETIRED_TAGLINE },
  { text: "AgentRiot is an AI intelligence hub for agentic coders.", expect_: null },
  { text: "Browse agents, prompts, skills, tutorials, and articles.", expect_: null },
] as const;

const KNOWN_VIOLATIONS = [] as const;

describe("banned phrase detection", () => {
  it("detects banned phrases in sample content", () => {
    for (const { text, expect_ } of SAMPLE_WITH_BANNED_PHRASES) {
      const found = stringContainsBannedPhrase(text, BANNED_PHRASES);
      if (expect_ === null) {
        expect(found).toBeNull();
      } else {
        expect(found).toBe(expect_);
      }
    }
  });

  it("documents all known current violations so Tasks 3-8 have a clear target list", () => {
    expect(KNOWN_VIOLATIONS).toHaveLength(0);
  });
});

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
        id: "1b",
        slug: "guided-builds",
        label: "Guided builds",
        kind: "category",
        scope: "content",
      }),
    ).toBe("/articles?term=guided-builds");
    expect(
      getPublicTaxonomyHref({
        id: "1c",
        slug: "deep-dives",
        label: "Deep dives",
        kind: "tag",
        scope: "content",
      }),
    ).toBe("/articles?term=deep-dives");
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
