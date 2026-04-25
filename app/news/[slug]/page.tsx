import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PillTag } from "@/components/ui/pill-tag";
import { StoryStreamTile } from "@/components/ui/story-stream-tile";
import { PublicShell } from "@/components/public/public-shell";
import { getNewsArticleBySlug } from "@/lib/news";
import { buildCanonical } from "@/lib/seo/canonical";
import { buildArticleJsonLd } from "@/lib/seo/json-ld";
import { buildMetadata } from "@/lib/seo/metadata";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getNewsArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  return buildMetadata({
    title: article.metaTitle ?? article.title,
    description: article.metaDescription ?? article.summary,
    canonical: article.canonicalUrl ?? `/news/${article.slug}`,
    type: "article",
  });
}

export default async function NewsArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getNewsArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const canonicalUrl = buildCanonical(article.canonicalUrl ?? `/news/${article.slug}`);
  const jsonLd = buildArticleJsonLd({
    title: article.title,
    description: article.summary,
    slug: article.slug,
    publishedAt: article.publishedAt.toISOString(),
    author: article.author,
  });
  const paragraphs = article.content.split(/\n\n+/).filter(Boolean);

  return (
    <PublicShell
      links={[
        { label: "NEWS", href: "/news", active: true },
        { label: "SOFTWARE", href: "/software" },
        { label: "AGENTS", href: "/agents" },
        { label: "FEED", href: "/feed" },
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

        <section className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
          <article className="max-w-4xl">
            <Link
              href="/news"
              className="inline-flex text-label-sm text-mint hover:text-deep-link"
            >
              ← All news
            </Link>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <PillTag variant="mint">{article.category}</PillTag>
              <PillTag variant="slate">{formatDate(article.publishedAt)}</PillTag>
            </div>
            <h1 className="mt-6 font-display text-display-md text-foreground">{article.title}</h1>
            <p className="mt-4 text-headline-sm text-mint">By {article.author}</p>
            <p className="mt-6 max-w-3xl text-body-relaxed text-muted-foreground">{article.summary}</p>

            <div className="mt-8 flex flex-wrap gap-3">
              {article.tags.map((tag) => (
                <PillTag key={tag} variant="white">
                  {tag}
                </PillTag>
              ))}
            </div>

            <div className="mt-10 space-y-6 text-body-relaxed text-muted-foreground">
              {paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>

            <StoryStreamTile variant="feature" size="feature" className="mt-10">
              <span className="text-label-light text-secondary-text">Canonical story URL</span>
              <a
                href={canonicalUrl}
                className="mt-3 inline-flex text-body-compact text-mint hover:text-deep-link"
              >
                {canonicalUrl}
              </a>
            </StoryStreamTile>
          </article>

          <aside className="flex flex-col gap-6">
            {article.relatedSoftware.length > 0 ? (
              <StoryStreamTile variant="feature" size="feature">
                <PillTag variant="ultraviolet">SOFTWARE IN THIS STORY</PillTag>
                <div className="mt-5 flex flex-col gap-4">
                  {article.relatedSoftware.map((entry) => (
                    <Link key={entry.id} href={`/software/${entry.slug}`} className="block">
                      <p className="text-headline-sm text-foreground">{entry.name}</p>
                      <p className="mt-2 text-body-compact text-secondary-text">{entry.description}</p>
                    </Link>
                  ))}
                </div>
              </StoryStreamTile>
            ) : null}

            {article.relatedAgents.length > 0 ? (
              <StoryStreamTile variant="feature" size="feature">
                <PillTag variant="mint">AGENTS TRACKING THIS SOFTWARE</PillTag>
                <div className="mt-5 flex flex-col gap-4">
                  {article.relatedAgents.map((agent) => (
                    <Link key={agent.id} href={`/agents/${agent.slug}`} className="block">
                      <p className="text-headline-sm text-foreground">{agent.name}</p>
                      <p className="mt-2 text-body-compact text-secondary-text">{agent.tagline}</p>
                    </Link>
                  ))}
                </div>
              </StoryStreamTile>
            ) : null}
          </aside>
        </section>
    </PublicShell>
  );
}
