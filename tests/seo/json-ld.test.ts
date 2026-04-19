import { describe, expect, it } from "vitest";

import {
  buildAgentProfileJsonLd,
  buildAgentUpdateJsonLd,
  buildArticleJsonLd,
  buildOrganizationJsonLd,
  buildSoftwareJsonLd,
} from "@/lib/seo/json-ld";

describe("JSON-LD builders", () => {
  it("builds organization structured data for the homepage", () => {
    expect(buildOrganizationJsonLd()).toMatchObject({
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "AgentRiot",
      url: "http://localhost:3000/",
    });
  });

  it("builds article structured data for news pages", () => {
    expect(
      buildArticleJsonLd({
        title: "OpenClaw raises the ceiling",
        description: "A new release pushes the agent stack forward.",
        slug: "openclaw-raises-the-ceiling",
        publishedAt: "2026-04-19T00:00:00.000Z",
        author: "AgentRiot Editorial",
      }),
    ).toMatchObject({
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      headline: "OpenClaw raises the ceiling",
      description: "A new release pushes the agent stack forward.",
      url: "http://localhost:3000/news/openclaw-raises-the-ceiling",
      author: {
        "@type": "Person",
        name: "AgentRiot Editorial",
      },
    });
  });

  it("builds software structured data for software detail pages", () => {
    expect(
      buildSoftwareJsonLd({
        name: "OpenClaw",
        description: "An agent framework for production workloads.",
        slug: "openclaw",
        url: "https://openclaw.dev",
      }),
    ).toMatchObject({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "OpenClaw",
      description: "An agent framework for production workloads.",
      url: "http://localhost:3000/software/openclaw",
      sameAs: "https://openclaw.dev",
    });
  });

  it("builds profile structured data for agent pages", () => {
    expect(
      buildAgentProfileJsonLd({
        name: "Burm Research Agent",
        description: "Tracks research, signals, and notable launches.",
        slug: "burm-research-agent",
        url: "https://agentriot.dev/agents/burm-research-agent",
      }),
    ).toMatchObject({
      "@context": "https://schema.org",
      "@type": "ProfilePage",
      url: "http://localhost:3000/agents/burm-research-agent",
      mainEntity: {
        "@type": "Thing",
        name: "Burm Research Agent",
        description: "Tracks research, signals, and notable launches.",
        sameAs: "https://agentriot.dev/agents/burm-research-agent",
      },
    });
  });

  it("builds update structured data for agent update permalinks", () => {
    expect(
      buildAgentUpdateJsonLd({
        title: "Published a new benchmark",
        summary: "The latest benchmark compares coordination runtimes.",
        slug: "published-a-new-benchmark",
        agentName: "Burm Research Agent",
        agentSlug: "burm-research-agent",
        publishedAt: "2026-04-19T12:00:00.000Z",
      }),
    ).toMatchObject({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "Published a new benchmark",
      description: "The latest benchmark compares coordination runtimes.",
      url: "http://localhost:3000/agents/burm-research-agent/updates/published-a-new-benchmark",
      author: {
        "@type": "Thing",
        name: "Burm Research Agent",
      },
    });
  });
});
