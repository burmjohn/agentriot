import type { Metadata } from "next";
import { connection } from "next/server";
import Link from "next/link";

import { EmptyState } from "@/components/public/empty-state";
import { PillTag } from "@/components/ui/pill-tag";
import { StoryStreamTile } from "@/components/ui/story-stream-tile";
import { SectionHeader } from "@/components/public/section-header";
import { StoryStreamRail } from "@/components/public/story-stream-rail";
import { StoryStreamRailItem } from "@/components/ui/story-stream-rail-item";
import { PublicShell } from "@/components/public/public-shell";
import { buildMetadata } from "@/lib/seo/metadata";
import { getFeaturedNewsArticle, getPublishedNewsArticles } from "@/lib/news";

export const metadata: Metadata = buildMetadata({
  title: "Agent News",
  description:
    "Editorial coverage of agent launches, infrastructure moves, and interface changes across the agent ecosystem.",
  canonical: "/news",
  type: "website",
});

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default async function NewsIndexPage() {
  await connection();

  const [featured, articles] = await Promise.all([
    getFeaturedNewsArticle(),
    getPublishedNewsArticles(),
  ]);
  const secondaryArticles = featured
    ? articles.filter((article) => article.slug !== featured.slug)
    : articles;

  return (
    <PublicShell
      mainClassName="mx-auto max-w-[1300px] px-6 py-16 md:py-24"
    >
        <h1 className="sr-only">Agent News</h1>

        <section className="mb-16 md:mb-24">
          <SectionHeader eyebrow="EDITORIAL STREAM" headline="NEWS" />
          <p className="mt-6 max-w-3xl text-body-relaxed text-muted-foreground">
            Editorial coverage of launches, infrastructure shifts, interface upgrades, and
            agent tooling worth tracking. Follow the story, then jump straight into the
            software directory and agent profiles behind each headline.
          </p>
        </section>

        {featured ? (
          <section className="mb-16 md:mb-24">
            <span className="text-label-light text-secondary-text block mb-6">
              FEATURED STORY
            </span>
            <Link href={`/news/${featured.slug}`} className="block">
              <StoryStreamTile variant="feature" size="feature">
                <div className="flex items-center justify-between gap-3">
                  <PillTag variant="white">{featured.category}</PillTag>
                  <span className="text-label-xs text-secondary-text">
                    {formatDate(featured.publishedAt)}
                  </span>
                </div>
                <p className="mt-5 text-label-sm text-[var(--riot-blue)]">{featured.author}</p>
                <h2 className="mt-3 text-headline-lg text-foreground transition-colors duration-150 hover:text-deep-link">
                  {featured.title}
                </h2>
                <p className="mt-4 text-body-relaxed text-secondary-text">
                  {featured.summary}
                </p>
              </StoryStreamTile>
            </Link>
          </section>
        ) : null}

        <section>
          <span className="text-label-light text-secondary-text block mb-6">
            LATEST STORIES
          </span>

          {secondaryArticles.length > 0 ? (
            <StoryStreamRail>
              {secondaryArticles.map((article) => (
                <Link
                  key={article.id}
                  href={`/news/${article.slug}`}
                  className="block"
                >
                  <StoryStreamRailItem
                    timestamp={formatDate(article.publishedAt)}
                    kicker={article.author}
                    headline={article.title}
                    deck={article.summary}
                    tag={article.category}
                    tagVariant="blue"
                  />
                </Link>
              ))}
            </StoryStreamRail>
          ) : featured ? null : (
            <EmptyState
              title="No stories published yet"
              description="The editorial rail is empty right now. New launches and software moves will land here once they are published."
            />
          )}
        </section>
    </PublicShell>
  );
}
