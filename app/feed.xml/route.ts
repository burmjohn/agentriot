import { buildRssFeedXml, listPublishedFeedItems } from "@/lib/public/feeds";
import { absoluteUrl, getSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

export async function GET() {
  const siteUrl = getSiteUrl();
  const xml = buildRssFeedXml(await listPublishedFeedItems(), {
    siteUrl,
    feedUrl: absoluteUrl("/feed.xml", siteUrl),
    title: "AgentRiot feed",
    description: "Latest published signal from the AgentRiot graph.",
  });

  return new Response(xml, {
    headers: {
      "content-type": "application/rss+xml; charset=utf-8",
      "cache-control": "public, s-maxage=900, stale-while-revalidate=3600",
    },
  });
}
