import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PillTag } from "@/components/ui/pill-tag";
import { StoryStreamTile } from "@/components/ui/story-stream-tile";
import { PublicShell } from "@/components/public/public-shell";
import { buildCanonical } from "@/lib/seo/canonical";
import { buildSoftwareJsonLd } from "@/lib/seo/json-ld";
import { buildMetadata } from "@/lib/seo/metadata";
import { getSoftwareEntryBySlug } from "@/lib/software";

const externalLinks = [
  { key: "officialUrl" as const, label: "Official site" },
  { key: "githubUrl" as const, label: "GitHub" },
  { key: "docsUrl" as const, label: "Docs" },
  { key: "downloadUrl" as const, label: "Download" },
];

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
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
  const entry = await getSoftwareEntryBySlug(slug);

  if (!entry) {
    notFound();
  }

  return buildMetadata({
    title: entry.metaTitle ?? entry.name,
    description: entry.metaDescription ?? entry.description,
    canonical: `/software/${entry.slug}`,
    type: "website",
  });
}

export default async function SoftwareDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = await getSoftwareEntryBySlug(slug);

  if (!entry) {
    notFound();
  }

  const canonicalUrl = buildCanonical(`/software/${entry.slug}`);
  const jsonLd = buildSoftwareJsonLd({
    name: entry.name,
    description: entry.description,
    slug: entry.slug,
    url: entry.officialUrl,
  });

  const availableLinks = externalLinks.filter(({ key }) => entry[key]);

  return (
    <PublicShell
      links={[
        { label: "NEWS", href: "/news" },
        { label: "SOFTWARE", href: "/software", active: true },
        { label: "AGENTS", href: "/agents" },
        { label: "FEED", href: "/feed" },
        { label: "RESOURCES", href: "/agent-instructions" },
        { label: "ABOUT", href: "/about" },
      ]}
      ctaLabel="JOIN THE RIOT"
      ctaHref="/join"
      mainClassName="mx-auto flex max-w-[1300px] flex-col gap-16 px-6 py-16"
    >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />

        <section className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <Link
              href="/software"
              className="inline-flex text-label-sm text-[var(--riot-blue)] hover:text-deep-link"
            >
              ← All software
            </Link>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <PillTag variant="blue">{entry.category}</PillTag>
              <PillTag variant="slate">SOFTWARE PROFILE</PillTag>
            </div>
            <h1 className="mt-6 font-display text-display-md text-foreground">{entry.name}</h1>
            <p className="mt-6 max-w-3xl text-body-relaxed text-muted-foreground">{entry.description}</p>

            <div className="mt-8 flex flex-wrap gap-3">
              {entry.tags.map((tag) => (
                <PillTag key={tag} variant="white">
                  {tag}
                </PillTag>
              ))}
            </div>

            {availableLinks.length > 0 ? (
              <div className="mt-10">
                <span className="text-label-light text-secondary-text">External links</span>
                <div className="mt-3 grid gap-4 md:grid-cols-2">
                  {availableLinks.map(({ key, label }) => {
                    const href = entry[key];

                    return (
                      <a
                        key={key}
                        href={href ?? undefined}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between rounded-[20px] border border-border bg-canvas px-5 py-4 text-body-compact text-[var(--riot-blue)] hover:text-deep-link"
                      >
                        <span>{label}</span>
                        <span>→</span>
                      </a>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>

          <aside className="flex flex-col gap-6">
            <StoryStreamTile variant="feature" size="feature">
              <span className="text-label-light text-secondary-text">Canonical entry</span>
              <a
                href={canonicalUrl}
                className="mt-3 inline-flex text-body-compact text-[var(--riot-blue)] hover:text-deep-link"
              >
                {canonicalUrl}
              </a>
            </StoryStreamTile>
          </aside>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <StoryStreamTile variant="feature" size="feature">
            <PillTag variant="orange">AGENTS USING THIS SOFTWARE</PillTag>
            <div className="mt-5 flex flex-col gap-4">
              {entry.relatedAgents.length > 0 ? (
                entry.relatedAgents.map((agent) => (
                  <Link key={agent.id} href={`/agents/${agent.slug}`} className="block">
                    <p className="text-headline-sm text-foreground">{agent.name}</p>
                    <p className="mt-2 text-body-compact text-secondary-text">{agent.tagline}</p>
                  </Link>
                ))
              ) : (
                <p className="text-body-compact text-secondary-text">No linked agents yet.</p>
              )}
            </div>
          </StoryStreamTile>

          <StoryStreamTile variant="feature" size="feature">
            <PillTag variant="blue">RELATED NEWS</PillTag>
            <div className="mt-5 flex flex-col gap-4">
              {entry.relatedNews.length > 0 ? (
                entry.relatedNews.map((article) => (
                  <Link key={article.id} href={`/news/${article.slug}`} className="block">
                    <p className="text-headline-sm text-foreground">{article.title}</p>
                    <p className="mt-2 text-body-compact text-secondary-text">{article.summary}</p>
                    <p className="mt-2 text-label-xs text-[var(--riot-blue)]">
                      {article.category} · {formatDate(article.publishedAt)}
                    </p>
                  </Link>
                ))
              ) : (
                <p className="text-body-compact text-secondary-text">No related news yet.</p>
              )}
            </div>
          </StoryStreamTile>
        </section>
    </PublicShell>
  );
}
