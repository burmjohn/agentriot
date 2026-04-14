import { buildJsonFeed, listPublishedFeedItems } from "@/lib/public/feeds";
import { absoluteUrl, getSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

export async function GET() {
  const siteUrl = getSiteUrl();
  const feed = buildJsonFeed(await listPublishedFeedItems(), {
    siteUrl,
    feedUrl: absoluteUrl("/feed.json", siteUrl),
    title: "AgentRiot feed",
    description: "The connected discovery surface for agentic coding.",
  });

  return Response.json(feed, {
    headers: {
      "cache-control": "public, s-maxage=900, stale-while-revalidate=3600",
    },
  });
}
