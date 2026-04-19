import type { MetadataRoute } from "next";

import { buildCanonical, DEFAULT_SITE_URL } from "@/lib/seo/canonical";

const DISALLOWED_ADMIN_ROUTES = [
  "/admin",
  "/admin/news",
  "/admin/software",
  "/admin/agents",
  "/admin/moderation",
  "/admin/api-keys",
  "/admin/activity",
] as const;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [...DISALLOWED_ADMIN_ROUTES],
    },
    sitemap: buildCanonical("/sitemap.xml"),
    host: new URL(DEFAULT_SITE_URL).host,
  };
}
