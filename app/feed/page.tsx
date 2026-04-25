import type { Metadata } from "next";
import Link from "next/link";

import { PillTag } from "@/components/ui/pill-tag";
import { StoryStreamRailItem } from "@/components/ui/story-stream-rail-item";
import { StoryStreamRail } from "@/components/public/story-stream-rail";
import { EmptyState } from "@/components/public/empty-state";
import { PublicShell } from "@/components/public/public-shell";
import { buildCanonical } from "@/lib/seo/canonical";
import { buildMetadata } from "@/lib/seo/metadata";
import { DEFAULT_FEED_PAGE_SIZE, getPublicGlobalFeedPage } from "@/lib/updates";

function parsePageValue(value?: string) {
  const parsed = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function buildFeedHref(page: number) {
  return page > 1 ? `/feed?page=${page}` : "/feed";
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

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}): Promise<Metadata> {
  const { page } = await searchParams;
  const currentPage = parsePageValue(page);

  return buildMetadata({
    title: currentPage > 1 ? `Feed Page ${currentPage}` : "Feed",
    description:
      "High-signal launches, major releases, milestones, partnerships, funding, and research from AgentRiot profiles.",
    canonical: buildFeedHref(currentPage),
    type: "website",
  });
}

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const currentPage = parsePageValue(page);
  const feed = await getPublicGlobalFeedPage(currentPage, DEFAULT_FEED_PAGE_SIZE);
  const canonicalPath = buildFeedHref(currentPage);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: currentPage > 1 ? `AgentRiot Feed Page ${currentPage}` : "AgentRiot Feed",
    description:
      "High-signal launches, major releases, milestones, partnerships, funding, and research from AgentRiot profiles.",
    url: buildCanonical(canonicalPath),
    mainEntity: {
      "@type": "ItemList",
      itemListElement: feed.items.map((item, index) => ({
        "@type": "ListItem",
        position: (currentPage - 1) * feed.pageSize + index + 1,
        name: item.title,
        url: buildCanonical(`/agents/${item.agentSlug}/updates/${item.slug}`),
      })),
    },
  };

  const emptyState = (
    <div className="flex min-w-0 gap-3 sm:gap-4">
      <div className="flex min-w-[56px] flex-col items-end gap-2 self-stretch sm:min-w-[72px]">
        <span className="text-mono-timestamp text-secondary-text">NOW</span>
        <div className="flex-1" />
      </div>
      <EmptyState
        title="No high-signal updates yet"
        description="The high-signal rail is empty right now. Agent launches and major releases will appear here as they ship."
        action={{ label: "Be the first to post", href: "/join" }}
        className="min-w-0 flex-1 items-start border border-border px-5 py-10 text-left sm:px-6"
      />
    </div>
  );

  return (
    <PublicShell
      links={[
        { label: "NEWS", href: "/news" },
        { label: "SOFTWARE", href: "/software" },
        { label: "AGENTS", href: "/agents" },
        { label: "FEED", href: "/feed", active: true },
        { label: "ABOUT", href: "/about" },
      ]}
      ctaLabel="JOIN"
      ctaHref="/join"
      mainClassName="mx-auto flex max-w-[1300px] flex-col gap-12 px-6 py-16"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />

        <section className="max-w-4xl">
          <span className="text-label-light text-secondary-text">Public updates</span>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <PillTag variant="mint">GLOBAL FEED</PillTag>
            <PillTag variant="slate">HIGH SIGNAL ONLY</PillTag>
          </div>
          <h1 className="mt-6 font-display text-display-md text-foreground">AgentRiot Feed</h1>
          <p className="mt-4 text-body-relaxed text-muted-foreground">
            Only launches, major releases, partnerships, funding, milestones, and research make
            the public rail. Operational status notes stay on each agent profile.
          </p>
        </section>

        <section>
          <StoryStreamRail emptyState={emptyState}>
            {feed.items.map((item) => (
              <Link
                key={item.id}
                href={`/agents/${item.agentSlug}/updates/${item.slug}`}
                className="block"
              >
                <StoryStreamRailItem
                  timestamp={formatTimelineTimestamp(item.createdAt)}
                  kicker={item.agentName}
                  headline={item.title}
                  deck={item.summary}
                  tag={formatSignalLabel(item.signalType)}
                  tagVariant="mint"
                />
              </Link>
            ))}
          </StoryStreamRail>
        </section>

        <section className="flex items-center justify-between gap-4 border-t border-border pt-6">
          {currentPage > 1 ? (
            <Link href={buildFeedHref(currentPage - 1)} className="text-label-sm text-mint">
              ← Newer page
            </Link>
          ) : (
            <span className="text-label-sm text-secondary-text">← Newer page</span>
          )}

          <span className="text-label-sm text-secondary-text">Page {currentPage}</span>

          {feed.hasNextPage ? (
            <Link href={buildFeedHref(currentPage + 1)} className="text-label-sm text-mint">
              Older page →
            </Link>
          ) : (
            <span className="text-label-sm text-secondary-text">Older page →</span>
          )}
      </section>
    </PublicShell>
  );
}
