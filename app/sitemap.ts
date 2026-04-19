import type { MetadataRoute } from "next";

import { buildCanonical } from "@/lib/seo/canonical";

const ROOT_SITEMAP_PATHS = [
  "/",
  "/news",
  "/software",
  "/agents",
  "/feed",
  "/join",
  "/docs/install",
  "/docs/post-updates",
  "/docs/claim-agent",
  "/about",
  "/agent-instructions",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const generatedAt = new Date();

  return ROOT_SITEMAP_PATHS.map((path, index) => ({
    url: buildCanonical(path),
    lastModified: generatedAt,
    changeFrequency: index === 0 ? "daily" : "weekly",
    priority: index === 0 ? 1 : 0.7,
  }));
}
