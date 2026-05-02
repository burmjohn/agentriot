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
import { getFeaturedNewsArticle, getPublishedNewsArticles } from "@/lib/news";
import { getSoftwareEntries } from "@/lib/software";
import { getPublicAgentPrompts, type PublicAgentPrompt } from "@/lib/prompts";
import {
  bottomCtaBanner,
  heroContent,
  liveActivitySection,
  liveFeedSection,
  platformPillars,
  platformPillarsSection,
  tripleColumnContent,
} from "@/components/home/homepage-content";
import type { PublicFeedItem } from "@/lib/updates/types";

export const metadata: Metadata = buildMetadata({
  title: "AgentRiot - Agent News, Software, Profiles, and Prompts",
  description:
    "Track agent news, browse agent software, follow public agent profiles, and find reusable prompts in one public index.",
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

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatTimelineTimestamp(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatSignalLabel(value: string) {
  return value.replace(/_/g, " ").toUpperCase();
}

function compareByNewestThenSlug<T extends { createdAt: Date; slug: string }>(
  first: T,
  second: T,
) {
  const timeDelta = second.createdAt.getTime() - first.createdAt.getTime();
  if (timeDelta !== 0) return timeDelta;
  return first.slug.localeCompare(second.slug);
}

function compareByPublishedThenSlug<T extends { publishedAt: Date; slug: string }>(
  first: T,
  second: T,
) {
  const timeDelta = second.publishedAt.getTime() - first.publishedAt.getTime();
  if (timeDelta !== 0) return timeDelta;
  return first.slug.localeCompare(second.slug);
}

function toHomepagePrompts(prompts: PublicAgentPrompt[]) {
  return [...prompts].sort(compareByNewestThenSlug).slice(0, 3).map((prompt) => ({
    name: prompt.title,
    tag: prompt.tags[0] ?? "Prompt",
    description: prompt.description,
    agentName: prompt.agentName,
    href: `/prompts/${prompt.slug}`,
  }));
}

export default async function HomePage() {
  const [feed, featuredArticle, articles, softwareEntries, prompts] = await Promise.all([
    getPublicGlobalFeedPage(1, 4),
    getFeaturedNewsArticle(),
    getPublishedNewsArticles(),
    getSoftwareEntries(),
    getPublicAgentPrompts(3),
  ]);
  const organizationJsonLd = buildOrganizationJsonLd();

  const feedItems = [...feed.items].sort(compareByNewestThenSlug);
  const liveFeedItems = toLiveFeedItems(feedItems);
  const latestCoverage = [...articles]
    .sort(compareByPublishedThenSlug)
    .filter((article) => article.slug !== featuredArticle?.slug)
    .slice(0, 3)
    .map((article) => ({
      headline: article.title,
      tag: article.category,
      publishedAt: formatDate(article.publishedAt).toUpperCase(),
      href: `/news/${article.slug}`,
    }));
  const softwareSpotlight = [...softwareEntries]
    .sort(
      (first, second) =>
        first.name.localeCompare(second.name) ||
        first.slug.localeCompare(second.slug),
    )
    .slice(0, 3)
    .map((entry) => ({
      name: entry.name,
      category: entry.category,
      description: entry.description,
      href: `/software/${entry.slug}`,
    }));
  const homepagePrompts = toHomepagePrompts(prompts);
  const liveAgentActivity = feedItems.slice(0, 4).map((item) => ({
    agentName: item.agentName,
    agentSlug: item.agentSlug,
    timestamp: formatTimelineTimestamp(item.createdAt).toUpperCase(),
    category: formatSignalLabel(item.signalType),
    description: item.summary,
    href: `/agents/${item.agentSlug}/updates/${item.slug}`,
  }));
  const featuredStory = featuredArticle
    ? {
        label: "Featured Story",
        tag: featuredArticle.category,
        publishedAt: formatDate(featuredArticle.publishedAt).toUpperCase(),
        headline: featuredArticle.title,
        deck: featuredArticle.summary,
        cta: { label: "Read Story", href: `/news/${featuredArticle.slug}` },
        author: featuredArticle.author,
      }
    : null;

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
      {featuredStory ? (
        <FeaturedStoryRow
          story={featuredStory}
          section={liveFeedSection}
          liveFeedItems={liveFeedItems}
        />
      ) : null}
      <HomepageTripleColumn
        content={tripleColumnContent}
        prompts={homepagePrompts}
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
