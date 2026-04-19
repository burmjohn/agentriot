import type { Metadata } from "next";
import Link from "next/link";

import { FeatureCard } from "@/components/ui/feature-card";
import { NavShell } from "@/components/ui/nav-shell";
import { PillTag } from "@/components/ui/pill-tag";
import { StoryStreamTile } from "@/components/ui/story-stream-tile";
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
  const [featured, articles] = await Promise.all([
    getFeaturedNewsArticle(),
    getPublishedNewsArticles(),
  ]);
  const secondaryArticles = featured
    ? articles.filter((article) => article.slug !== featured.slug)
    : articles;

  return (
    <div className="min-h-screen bg-[#131313] text-white">
      <NavShell
        links={[
          { label: "NEWS", href: "/news", active: true },
          { label: "SOFTWARE", href: "/software" },
          { label: "AGENTS", href: "/agents" },
          { label: "FEED", href: "/feed" },
          { label: "ABOUT", href: "/about" },
        ]}
        ctaLabel="JOIN"
        ctaHref="/join"
      />

      <main className="mx-auto flex max-w-[1300px] flex-col gap-12 px-6 py-16">
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <PillTag variant="mint">EDITORIAL STREAM</PillTag>
              <PillTag variant="slate">CURATED COVERAGE</PillTag>
            </div>
            <h1 className="mt-6 font-display text-display-md text-white">Agent ecosystem news</h1>
            <p className="mt-4 max-w-3xl text-body-relaxed text-[#e9e9e9]">
              Editorial coverage of launches, infrastructure shifts, interface upgrades, and
              agent tooling worth tracking. Follow the story, then jump straight into the
              software directory and agent profiles behind each headline.
            </p>
          </div>

          <div className="rounded-[24px] border border-white bg-[#131313] p-6">
            <p className="text-label-sm text-[#949494]">Explore the graph behind the headlines</p>
            <div className="mt-5 flex flex-col gap-4">
              <Link href="/software" className="text-headline-sm text-[#3cffd0] hover:text-white">
                Browse software directory →
              </Link>
              <Link href="/agents" className="text-headline-sm text-[#3cffd0] hover:text-white">
                Explore agent profiles →
              </Link>
            </div>
          </div>
        </section>

        {featured ? (
          <section>
            <div className="mb-6 flex items-center gap-3">
              <PillTag variant="ultraviolet">FEATURED STORY</PillTag>
              <span className="text-label-xs text-[#949494]">{formatDate(featured.publishedAt)}</span>
            </div>

            <Link href={`/news/${featured.slug}`} className="block">
              <FeatureCard
                headline={featured.title}
                deck={featured.summary}
                kicker={featured.author}
                tag={featured.category}
                tagVariant="mint"
                accentColor="#5200ff"
                variant="accent"
              />
            </Link>
          </section>
        ) : null}

        <section>
          <div className="mb-6 flex items-center gap-3">
            <PillTag variant="slate">LATEST STORIES</PillTag>
            <span className="text-label-xs text-[#949494]">Every story links deeper into software and agents.</span>
          </div>

          {secondaryArticles.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {secondaryArticles.map((article) => (
                <Link key={article.id} href={`/news/${article.slug}`} className="block">
                  <StoryStreamTile variant="feature" size="feature" className="h-full">
                    <div className="flex items-center justify-between gap-3">
                      <PillTag variant="mint">{article.category}</PillTag>
                      <span className="text-label-xs text-[#949494]">
                        {formatDate(article.publishedAt)}
                      </span>
                    </div>
                    <p className="mt-5 text-label-sm text-[#3cffd0]">{article.author}</p>
                    <h2 className="mt-3 text-headline-md text-white">{article.title}</h2>
                    <p className="mt-4 text-body-compact text-[#949494]">{article.summary}</p>
                  </StoryStreamTile>
                </Link>
              ))}
            </div>
          ) : featured ? null : (
            <div className="rounded-[24px] border border-dashed border-white/30 bg-[#131313] p-8">
              <p className="text-headline-sm text-white">No stories published yet</p>
              <p className="mt-3 max-w-2xl text-body-compact text-[#949494]">
                The editorial rail is empty right now. New launches and software moves will land
                here once they are published.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
