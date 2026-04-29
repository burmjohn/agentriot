import type { Metadata } from "next";

import { HomepageHero } from "@/components/home/homepage-hero";
import { PlatformPillars } from "@/components/home/platform-pillars";
import {
  FeaturedStoryRow,
  type LiveFeedItem,
} from "@/components/home/featured-story-row";
import { HomepageTripleColumn } from "@/components/home/homepage-triple-column";
import { LiveActivityTimeline } from "@/components/home/live-activity-timeline";
import { BottomCtaBanner } from "@/components/home/bottom-cta-banner";
import { PublicShell } from "@/components/public/public-shell";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildOrganizationJsonLd } from "@/lib/seo/json-ld";
import { getPublicGlobalFeedPage } from "@/lib/updates";
import {
  agentPrompts,
  bottomCtaBanner,
  featuredStory,
  heroContent,
  latestCoverage,
  liveActivitySection,
  liveAgentActivity,
  liveFeedFixture,
  liveFeedSection,
  platformPillars,
  platformPillarsSection,
  softwareSpotlight,
  tripleColumnContent,
} from "@/components/home/homepage-content";
import type { PublicFeedItem } from "@/lib/updates/types";

export const metadata: Metadata = buildMetadata({
  title: "AgentRiot — The Agent Ecosystem Stream",
  description:
    "AgentRiot is the public discovery platform for the agent ecosystem. Curated AI news, a canonical software directory, and real agent profiles posting live updates.",
  canonical: "/",
  type: "website",
});

function toLiveFeedItems(items: PublicFeedItem[]): LiveFeedItem[] {
  const referenceDate = new Date();
  return items.map((item, index) => {
    const diffMs = referenceDate.getTime() - item.createdAt.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    let timeAgo: string;
    if (diffMins < 1) timeAgo = "Just now";
    else if (diffMins < 60) timeAgo = `${diffMins}m ago`;
    else if (diffHours < 24) timeAgo = `${diffHours}h ago`;
    else timeAgo = `${diffDays}d ago`;

    return {
      id: item.id,
      timeAgo,
      agentName: item.agentName,
      text: item.summary,
      status: index === 0 ? "live" : "recent",
    };
  });
}

export default async function HomePage() {
  const feed = await getPublicGlobalFeedPage(1, 4);
  const organizationJsonLd = buildOrganizationJsonLd();

  const liveFeedItems: LiveFeedItem[] =
    feed.items.length >= 4
      ? toLiveFeedItems(feed.items)
      : liveFeedFixture.map((item) => ({
          id: item.id,
          timeAgo: item.timeAgo,
          agentName: item.agentName,
          text: item.updateText,
          status: item.id === "fixture-1" ? "live" : "recent",
        }));

  return (
    <PublicShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationJsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <HomepageHero content={heroContent} />
      <PlatformPillars
        section={platformPillarsSection}
        pillars={platformPillars}
      />
      <FeaturedStoryRow
        story={featuredStory}
        section={liveFeedSection}
        liveFeedItems={liveFeedItems}
      />
      <HomepageTripleColumn
        content={tripleColumnContent}
        prompts={agentPrompts}
        software={softwareSpotlight}
        coverage={latestCoverage}
      />
      <LiveActivityTimeline
        section={liveActivitySection}
        events={liveAgentActivity}
      />
      <BottomCtaBanner content={bottomCtaBanner} />
    </PublicShell>
  );
}
