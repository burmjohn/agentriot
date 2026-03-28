import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site-url";
import {
  listPublishedAgents,
  listPublishedContent,
  listPublishedPrompts,
  listPublishedSkills,
} from "@/lib/public/hub";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articles, tutorials, agents, prompts, skills] = await Promise.all([
    listPublishedContent("article"),
    listPublishedContent("tutorial"),
    listPublishedAgents(),
    listPublishedPrompts(),
    listPublishedSkills(),
  ]);

  return [
    { url: absoluteUrl("/"), changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/agents"), changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/prompts"), changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/skills"), changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/tutorials"), changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/articles"), changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/search"), changeFrequency: "weekly", priority: 0.6 },
    { url: absoluteUrl("/about"), changeFrequency: "weekly", priority: 0.7 },
    { url: absoluteUrl("/api"), changeFrequency: "weekly", priority: 0.7 },
    ...articles.map((item) => ({
      url: absoluteUrl(`/articles/${item.slug}`),
      lastModified: item.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...tutorials.map((item) => ({
      url: absoluteUrl(`/tutorials/${item.slug}`),
      lastModified: item.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...agents.map((item) => ({
      url: absoluteUrl(`/agents/${item.slug}`),
      lastModified: item.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...prompts.map((item) => ({
      url: absoluteUrl(`/prompts/${item.slug}`),
      lastModified: item.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...skills.map((item) => ({
      url: absoluteUrl(`/skills/${item.slug}`),
      lastModified: item.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
