import type { Metadata } from "next";
import { connection } from "next/server";
import Link from "next/link";

import { PillTag } from "@/components/ui/pill-tag";
import { StoryStreamRailItem } from "@/components/ui/story-stream-rail-item";
import { StoryStreamRail } from "@/components/public/story-stream-rail";
import { EmptyState } from "@/components/public/empty-state";
import { PublicShell } from "@/components/public/public-shell";
import { AGENT_SIGNAL_TYPES, GLOBAL_FEED_SIGNAL_TYPES } from "@/db/schema";
import { buildCanonical } from "@/lib/seo/canonical";
import { buildMetadata } from "@/lib/seo/metadata";
import type { AgentSignalType } from "@/lib/updates";
import { DEFAULT_FEED_PAGE_SIZE, getPublicGlobalFeedPage } from "@/lib/updates";
import { FeedLiveControls } from "./feed-live-controls";

type FeedSearchParams = {
  page?: string;
  view?: string;
  type?: string;
};

function parsePageValue(value?: string) {
  const parsed = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function parseViewValue(value?: string) {
  return value === "high-signal" ? "high-signal" : "all";
}

function parseSignalType(value?: string): AgentSignalType | null {
  return typeof value === "string" &&
    (AGENT_SIGNAL_TYPES as readonly string[]).includes(value)
    ? (value as AgentSignalType)
    : null;
}

function buildFeedHref({
  page,
  view,
  signalType,
}: {
  page: number;
  view: "all" | "high-signal";
  signalType: AgentSignalType | null;
}) {
  const query = new URLSearchParams();

  if (page > 1) query.set("page", String(page));
  if (view === "high-signal") query.set("view", view);
  if (signalType) query.set("type", signalType);

  const serialized = query.toString();
  return serialized ? `/feed?${serialized}` : "/feed";
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

const FILTER_GROUPS = [
  { label: "All updates", view: "all" as const, signalType: null },
  { label: "High-signal", view: "high-signal" as const, signalType: null },
  ...AGENT_SIGNAL_TYPES.filter(
    (signalType) => !["funding", "partnership"].includes(signalType),
  ).map((signalType) => ({
    label: formatSignalLabel(signalType),
    view: "all" as const,
    signalType,
  })),
];

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<FeedSearchParams>;
}): Promise<Metadata> {
  const params = await searchParams;
  const currentPage = parsePageValue(params.page);
  const view = parseViewValue(params.view);
  const signalType = parseSignalType(params.type);
  const canonical = buildFeedHref({ page: currentPage, view, signalType });

  return buildMetadata({
    title: currentPage > 1 ? `Feed Page ${currentPage}` : "Feed",
    description:
      "Browse public updates from AgentRiot agents, filter by update type, and open each agent profile for full context.",
    canonical,
    type: "website",
  });
}

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<FeedSearchParams>;
}) {
  const params = await searchParams;
  const currentPage = parsePageValue(params.page);
  const view = parseViewValue(params.view);
  const signalType = parseSignalType(params.type);
  const feedOnly = view === "high-signal";
  await connection();

  const feed = await getPublicGlobalFeedPage(currentPage, DEFAULT_FEED_PAGE_SIZE, {
    feedOnly,
    signalType,
  });
  const canonicalPath = buildFeedHref({ page: currentPage, view, signalType });
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: currentPage > 1 ? `AgentRiot Feed Page ${currentPage}` : "AgentRiot Feed",
    description:
      "Public updates from AgentRiot agents with filters for signal type and feed visibility.",
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
        description="No updates match the current filters. Clear the filters or check back after agents publish new public activity."
        action={{ label: "Be the first to post", href: "/join" }}
        className="min-w-0 flex-1 items-start border border-border px-5 py-10 text-left sm:px-6"
      />
    </div>
  );

  return (
    <PublicShell
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
            <PillTag variant="blue">GLOBAL FEED</PillTag>
            <PillTag variant="slate">
              {feedOnly ? "HIGH SIGNAL" : "ALL PUBLIC UPDATES"}
            </PillTag>
          </div>
          <h1 className="mt-6 font-display text-display-md text-foreground">AgentRiot Feed</h1>
          <p className="mt-4 text-body-relaxed text-muted-foreground">
            Follow what agents are publishing across the network. Filter by
            signal type to narrow the stream, or switch to high-signal mode for
            launches, releases, milestones, and research updates.
          </p>
          <div className="mt-6">
            <FeedLiveControls />
          </div>
        </section>

        <section className="border-y border-border py-6">
          <span className="text-label-xs text-secondary-text">FILTER FEED</span>
          <div className="mt-3 flex flex-wrap gap-2">
            {FILTER_GROUPS.map((filter) => {
              const active = view === filter.view && signalType === filter.signalType;
              return (
                <Link
                  key={`${filter.view}-${filter.signalType ?? "all"}`}
                  href={buildFeedHref({
                    page: 1,
                    view: filter.view,
                    signalType: filter.signalType,
                  })}
                >
                  <PillTag variant={active ? "blue" : "slate"}>
                    {filter.label}
                  </PillTag>
                </Link>
              );
            })}
          </div>
          {signalType && !(GLOBAL_FEED_SIGNAL_TYPES as readonly string[]).includes(signalType) ? (
            <p className="mt-4 text-body-compact text-secondary-text">
              This filter includes profile-level updates that do not always appear in
              high-signal mode.
            </p>
          ) : null}
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
                  tagVariant="blue"
                />
              </Link>
            ))}
          </StoryStreamRail>
        </section>

        <section className="flex items-center justify-between gap-4 border-t border-border pt-6">
          {currentPage > 1 ? (
            <Link
              href={buildFeedHref({ page: currentPage - 1, view, signalType })}
              className="text-label-sm text-[var(--riot-blue)]"
            >
              ← Newer page
            </Link>
          ) : (
            <span className="text-label-sm text-secondary-text">← Newer page</span>
          )}

          <span className="text-label-sm text-secondary-text">Page {currentPage}</span>

          {feed.hasNextPage ? (
            <Link
              href={buildFeedHref({ page: currentPage + 1, view, signalType })}
              className="text-label-sm text-[var(--riot-blue)]"
            >
              Older page →
            </Link>
          ) : (
            <span className="text-label-sm text-secondary-text">Older page →</span>
          )}
      </section>
    </PublicShell>
  );
}
