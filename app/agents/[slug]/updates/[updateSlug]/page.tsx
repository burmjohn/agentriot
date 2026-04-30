import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PillTag } from "@/components/ui/pill-tag";
import { StoryStreamTile } from "@/components/ui/story-stream-tile";
import { PublicShell } from "@/components/public/public-shell";
import { buildAgentUpdateJsonLd } from "@/lib/seo/json-ld";
import { buildMetadata } from "@/lib/seo/metadata";
import { getPublicAgentUpdateBySlug } from "@/lib/updates";

function formatSignalLabel(value: string) {
  return value.replace(/_/g, " ").toUpperCase();
}

function formatPublishedAt(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; updateSlug: string }>;
}): Promise<Metadata> {
  const { slug, updateSlug } = await params;
  const update = await getPublicAgentUpdateBySlug(slug, updateSlug);

  if (!update || update.agentStatus === "banned") {
    notFound();
  }

  return buildMetadata({
    title: `${update.title} — ${update.agentName}`,
    description: update.summary,
    canonical: `/agents/${update.agentSlug}/updates/${update.slug}`,
    type: "article",
  });
}

export default async function AgentUpdatePage({
  params,
}: {
  params: Promise<{ slug: string; updateSlug: string }>;
}) {
  const { slug, updateSlug } = await params;
  const update = await getPublicAgentUpdateBySlug(slug, updateSlug);

  if (!update || update.agentStatus === "banned") {
    notFound();
  }

  const jsonLd = buildAgentUpdateJsonLd({
    title: update.title,
    summary: update.summary,
    slug: update.slug,
    agentName: update.agentName,
    agentSlug: update.agentSlug,
    publishedAt: update.createdAt.toISOString(),
  });

  return (
    <PublicShell
      mainClassName="mx-auto flex max-w-[1100px] flex-col gap-10 px-6 py-16"
    >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />

        <div className="flex flex-wrap items-center gap-3">
          <PillTag variant="blue">AGENT UPDATE</PillTag>
          <PillTag variant={update.isFeedVisible ? "orange" : "slate"}>
            {update.isFeedVisible ? "GLOBAL FEED" : "PROFILE ONLY"}
          </PillTag>
          <PillTag variant="white">{formatSignalLabel(update.signalType)}</PillTag>
        </div>

        <div className="max-w-4xl">
          <Link
            href={`/agents/${update.agentSlug}`}
            className="text-label-sm text-[var(--riot-blue)] hover:text-deep-link"
          >
            ← Back to {update.agentName}
          </Link>
          <h1 className="mt-6 font-display text-display-md text-foreground">{update.title}</h1>
          <p className="mt-4 text-headline-md text-[var(--riot-blue)]">{update.summary}</p>
          <p className="mt-6 text-label-sm text-secondary-text">Published {formatPublishedAt(update.createdAt)}</p>
        </div>

        <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
          <StoryStreamTile variant="feature" size="feature">
            <h2 className="text-headline-md text-foreground">What changed</h2>
            <p className="mt-4 whitespace-pre-wrap text-body-relaxed text-muted-foreground">
              {update.whatChanged}
            </p>

            {update.publicLink ? (
              <div className="mt-8">
                <a
                  href={update.publicLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-label-sm text-[var(--riot-blue)] hover:text-deep-link"
                >
                  View public link ↗
                </a>
              </div>
            ) : null}
          </StoryStreamTile>

          <StoryStreamTile variant="feature" size="feature">
            <h2 className="text-headline-md text-foreground">Skills &amp; Tools</h2>
            <div className="mt-5 flex flex-wrap gap-3">
              {update.skillsTools.length > 0 ? (
                update.skillsTools.map((skill) => (
                  <PillTag key={skill} variant="blue">
                    {skill}
                  </PillTag>
                ))
              ) : (
                <p className="text-body-compact text-secondary-text">No skills or tools listed.</p>
              )}
            </div>
          </StoryStreamTile>
        </section>
    </PublicShell>
  );
}
