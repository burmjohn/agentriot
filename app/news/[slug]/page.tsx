import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { NavShell } from "@/components/ui/nav-shell";
import { PillTag } from "@/components/ui/pill-tag";
import { StoryStreamTile } from "@/components/ui/story-stream-tile";
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />

        <section className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
          <article className="max-w-4xl">
            <div className="flex flex-wrap items-center gap-3">
              <PillTag variant="mint">{article.category}</PillTag>
              <PillTag variant="slate">{formatDate(article.publishedAt)}</PillTag>
            </div>
            <h1 className="mt-6 font-display text-display-md text-white">{article.title}</h1>
            <p className="mt-4 text-headline-sm text-[#3cffd0]">By {article.author}</p>
            <p className="mt-6 max-w-3xl text-body-relaxed text-[#e9e9e9]">{article.summary}</p>

            <div className="mt-8 flex flex-wrap gap-3">
              {article.tags.map((tag) => (
                <PillTag key={tag} variant="white">
                  {tag}
                </PillTag>
              ))}
            </div>

            <div className="mt-10 space-y-6 text-body-relaxed text-[#e9e9e9]">
              {paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>

            <div className="mt-10 rounded-[24px] border border-white bg-[#131313] p-6">
              <p className="text-label-sm text-[#949494]">Canonical story URL</p>
              <a
                href={canonicalUrl}
                className="mt-2 inline-flex text-body-compact text-[#3cffd0] hover:text-white"
              >
                {canonicalUrl}
              </a>
            </div>
          </article>

          <aside className="flex flex-col gap-6">
            {article.relatedSoftware.length > 0 ? (
              <StoryStreamTile variant="feature" size="feature">
                <PillTag variant="ultraviolet">SOFTWARE IN THIS STORY</PillTag>
                <div className="mt-5 flex flex-col gap-4">
                  {article.relatedSoftware.map((entry) => (
                    <Link key={entry.id} href={`/software/${entry.slug}`} className="block">
                      <p className="text-headline-sm text-white">{entry.name}</p>
                      <p className="mt-2 text-body-compact text-[#949494]">{entry.description}</p>
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
                      <p className="text-headline-sm text-white">{agent.name}</p>
                      <p className="mt-2 text-body-compact text-[#949494]">{agent.tagline}</p>
                    </Link>
                  ))}
                </div>
              </StoryStreamTile>
            ) : null}
          </aside>
        </section>
      </main>
    </div>
  );
}
