import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { NavShell } from "@/components/ui/nav-shell";
import { PillTag } from "@/components/ui/pill-tag";
import { StoryStreamTile } from "@/components/ui/story-stream-tile";
import { buildCanonical } from "@/lib/seo/canonical";
import { buildSoftwareJsonLd } from "@/lib/seo/json-ld";
import { buildMetadata } from "@/lib/seo/metadata";
import { getSoftwareEntryBySlug } from "@/lib/software";

const externalLinks = [
  { key: "officialUrl", label: "Official site" },
  { key: "githubUrl", label: "GitHub" },
  { key: "docsUrl", label: "Docs" },
  { key: "downloadUrl", label: "Download" },
] as const;

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

  return (
    <div className="min-h-screen bg-[#131313] text-white">
      <NavShell
        links={[
          { label: "NEWS", href: "/news" },
          { label: "SOFTWARE", href: "/software", active: true },
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

        <section className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <PillTag variant="mint">{entry.category}</PillTag>
              <PillTag variant="slate">SOFTWARE PROFILE</PillTag>
            </div>
            <h1 className="mt-6 font-display text-display-md text-white">{entry.name}</h1>
            <p className="mt-6 max-w-3xl text-body-relaxed text-[#e9e9e9]">{entry.description}</p>

            <div className="mt-8 flex flex-wrap gap-3">
              {entry.tags.map((tag) => (
                <PillTag key={tag} variant="white">
                  {tag}
                </PillTag>
              ))}
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-2">
              {externalLinks.map(({ key, label }) => {
                const href = entry[key];

                if (!href) {
                  return null;
                }

                return (
                  <a
                    key={key}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-[20px] border border-white bg-[#131313] px-5 py-4 text-body-compact text-[#3cffd0] hover:text-white"
                  >
                    {label} →
                  </a>
                );
              })}
            </div>
          </div>

          <aside>
            <div className="rounded-[24px] border border-white bg-[#131313] p-6">
              <p className="text-label-sm text-[#949494]">Canonical entry</p>
              <a href={canonicalUrl} className="mt-2 inline-flex text-body-compact text-[#3cffd0] hover:text-white">
                {canonicalUrl}
              </a>
            </div>
          </aside>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <StoryStreamTile variant="feature" size="feature">
            <PillTag variant="ultraviolet">AGENTS USING THIS SOFTWARE</PillTag>
            <div className="mt-5 flex flex-col gap-4">
              {entry.relatedAgents.length > 0 ? (
                entry.relatedAgents.map((agent) => (
                  <Link key={agent.id} href={`/agents/${agent.slug}`} className="block">
                    <p className="text-headline-sm text-white">{agent.name}</p>
                    <p className="mt-2 text-body-compact text-[#949494]">{agent.tagline}</p>
                  </Link>
                ))
              ) : (
                <p className="text-body-compact text-[#949494]">No linked agents yet.</p>
              )}
            </div>
          </StoryStreamTile>

          <StoryStreamTile variant="feature" size="feature">
            <PillTag variant="mint">RELATED NEWS</PillTag>
            <div className="mt-5 flex flex-col gap-4">
              {entry.relatedNews.length > 0 ? (
                entry.relatedNews.map((article) => (
                  <Link key={article.id} href={`/news/${article.slug}`} className="block">
                    <p className="text-headline-sm text-white">{article.title}</p>
                    <p className="mt-2 text-body-compact text-[#949494]">{article.summary}</p>
                    <p className="mt-2 text-label-xs text-[#3cffd0]">
                      {article.category} · {formatDate(article.publishedAt)}
                    </p>
                  </Link>
                ))
              ) : (
                <p className="text-body-compact text-[#949494]">No related news yet.</p>
              )}
            </div>
          </StoryStreamTile>
        </section>
      </main>
    </div>
  );
}
