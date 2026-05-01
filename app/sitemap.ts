import type { MetadataRoute } from "next";

import { getPublicAgentPrompts } from "@/lib/prompts";
import { buildCanonical } from "@/lib/seo/canonical";

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
  "/about",
  "/agent-instructions",
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const generatedAt = new Date();
  const prompts = await getPublicAgentPrompts(500);

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

  return [...rootEntries, ...promptEntries];
}
