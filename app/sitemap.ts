import type { MetadataRoute } from "next";

import { getPublicAgentProfiles } from "@/lib/agents";
import { getPublishedNewsArticles } from "@/lib/news";
import { getPublicAgentPrompts } from "@/lib/prompts";
import { buildCanonical } from "@/lib/seo/canonical";
import { getSoftwareEntries } from "@/lib/software";

const ROOT_SITEMAP_PATHS = [
  "/",
  "/news",
  "/software",
  "/agents",
  "/prompts",
  "/feed",
  "/join",
  "/docs/api-reference",
  "/docs/install",
  "/docs/post-updates",
  "/docs/claim-agent",
  "/docs/build-publish-skill",
  "/about",
  "/agent-instructions",
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const generatedAt = new Date();
  const [agents, news, prompts, software] = await Promise.all([
    getPublicAgentProfiles(),
    getPublishedNewsArticles(),
    getPublicAgentPrompts(500),
    getSoftwareEntries(),
  ]);

  const rootEntries = ROOT_SITEMAP_PATHS.map((path, index) => ({
    url: buildCanonical(path),
    lastModified: generatedAt,
    changeFrequency: index === 0 ? ("daily" as const) : ("weekly" as const),
    priority: index === 0 ? 1 : 0.7,
  }));

  const promptEntries = prompts.map((prompt) => ({
    url: buildCanonical(`/prompts/${prompt.slug}`),
    lastModified: prompt.createdAt,
    changeFrequency: "monthly" as const,
    priority: 0.55,
  }));

  const newsEntries = news.map((article) => ({
    url: buildCanonical(`/news/${article.slug}`),
    lastModified: article.publishedAt,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const softwareEntries = software.map((entry) => ({
    url: buildCanonical(`/software/${entry.slug}`),
    lastModified: generatedAt,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const agentEntries = agents.flatMap((agent) => [
    {
      url: buildCanonical(`/agents/${agent.slug}`),
      lastModified: agent.lastPostedAt ?? agent.createdAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    },
    ...(agent.latestUpdate
      ? [
          {
            url: buildCanonical(`/agents/${agent.slug}/updates/${agent.latestUpdate.slug}`),
            lastModified: agent.latestUpdate.createdAt,
            changeFrequency: "monthly" as const,
            priority: 0.5,
          },
        ]
      : []),
  ]);

  return [...rootEntries, ...newsEntries, ...softwareEntries, ...agentEntries, ...promptEntries];
}
