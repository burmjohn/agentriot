import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  getPublicTaxonomyHref,
  groupTaxonomyTermsByKind,
} from "@/lib/public/presentation";

const BANNED_PHRASES = [
  "Phase 1",
  "admin console",
  "ADMIN_EMAIL_ALLOWLIST",
  "Track what changed in AI. Find what to use next.",
] as const;

function stringContainsBannedPhrase(text: string, banned: readonly string[]): string | null {
  for (const phrase of banned) {
    if (text.includes(phrase)) return phrase;
  }
  return null;
}

const SAMPLE_WITH_BANNED_PHRASES = [
  { text: "Phase 1 favors public utility over heavy operations tooling.", expect_: "Phase 1" },
  { text: "Sign in to the admin console to manage your content.", expect_: "admin console" },
  { text: "Set ADMIN_EMAIL_ALLOWLIST to enable first-admin creation.", expect_: "ADMIN_EMAIL_ALLOWLIST" },
  { text: "Track what changed in AI. Find what to use next.", expect_: "Track what changed in AI. Find what to use next." },
  { text: "AgentRiot is an AI intelligence hub for agentic coders.", expect_: null },
  { text: "Browse agents, prompts, skills, tutorials, and articles.", expect_: null },
] as const;

const KNOWN_VIOLATIONS = [
  { file: "app/page.tsx", phrase: "admin console" },
  { file: "app/page.tsx", phrase: "Track what changed in AI. Find what to use next." },
  { file: "app/about/page.tsx", phrase: "Phase 1" },
  { file: "app/sign-in/auth-form.tsx", phrase: "admin console" },
  { file: "app/sign-in/auth-form.tsx", phrase: "ADMIN_EMAIL_ALLOWLIST" },
  { file: "app/agents/page.tsx", phrase: "admin console" },
  { file: "app/search/page.tsx", phrase: "admin console" },
  { file: "lib/seo/metadata.ts", phrase: "Track what changed in AI. Find what to use next." },
] as const;

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
    expect(KNOWN_VIOLATIONS).toHaveLength(8);
    expect(KNOWN_VIOLATIONS.map((v) => v.file)).toContain("app/page.tsx");
    expect(KNOWN_VIOLATIONS.map((v) => v.phrase)).toContain("Phase 1");
    expect(KNOWN_VIOLATIONS.map((v) => v.phrase)).toContain("admin console");
    expect(KNOWN_VIOLATIONS.map((v) => v.phrase)).toContain("ADMIN_EMAIL_ALLOWLIST");
    expect(KNOWN_VIOLATIONS.map((v) => v.phrase)).toContain("Track what changed in AI. Find what to use next.");
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
      getPublicTaxonomyHref(
        {
          id: "1b",
          slug: "guided-builds",
          label: "Guided builds",
          kind: "category",
          scope: "content",
        },
        "tutorial",
      ),
    ).toBe("/tutorials?term=guided-builds");
    expect(
      getPublicTaxonomyHref(
        {
          id: "1c",
          slug: "deep-dives",
          label: "Deep dives",
          kind: "tag",
          scope: "content",
        },
        "article",
      ),
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
