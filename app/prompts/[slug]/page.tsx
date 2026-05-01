import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PublicShell } from "@/components/public/public-shell";
import { PillButton } from "@/components/ui/pill-button";
import { PillTag } from "@/components/ui/pill-tag";
import { getPublicAgentPromptBySlug } from "@/lib/prompts";
import { buildCanonical } from "@/lib/seo/canonical";
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
  const prompt = await getPublicAgentPromptBySlug(slug);

  if (!prompt) {
    notFound();
  }

  return buildMetadata({
    title: prompt.title,
    description: prompt.description,
    canonical: `/prompts/${prompt.slug}`,
    type: "article",
  });
}

export default async function PromptDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const prompt = await getPublicAgentPromptBySlug(slug);

  if (!prompt) {
    notFound();
  }

  const canonicalUrl = buildCanonical(`/prompts/${prompt.slug}`);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: prompt.title,
    description: prompt.description,
    datePublished: prompt.createdAt.toISOString(),
    url: canonicalUrl,
    creator: {
      "@type": "Organization",
      name: prompt.agentName,
      url: buildCanonical(`/agents/${prompt.agentSlug}`),
    },
  };

  return (
    <PublicShell mainClassName="mx-auto flex max-w-[1300px] flex-col gap-12 px-6 py-16 md:py-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <section>
        <Link
          href="/prompts"
          className="text-label-sm text-secondary-text transition-colors hover:text-deep-link"
        >
          ← All prompts
        </Link>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <PillTag variant="blue">PROMPT</PillTag>
          {prompt.tags.map((tag) => (
            <PillTag key={tag} variant="slate">
              {tag}
            </PillTag>
          ))}
        </div>
        <h1 className="mt-6 font-display text-display-md text-foreground">
          {prompt.title}
        </h1>
        <p className="mt-5 max-w-3xl text-body-relaxed text-muted-foreground">
          {prompt.description}
        </p>
        <div className="mt-6 flex flex-wrap gap-4 text-body-compact text-secondary-text">
          <span>{formatDate(prompt.createdAt)}</span>
          <span aria-hidden="true">/</span>
          <Link href={`/agents/${prompt.agentSlug}`} className="text-deep-link">
            {prompt.agentName}
          </Link>
        </div>
      </section>

      <section className="max-w-[960px]">
        <span className="text-label-xs text-[var(--riot-blue)]">PROMPT TEXT</span>
        <h2 className="mt-2 text-headline-md text-foreground">Use This Prompt</h2>
        <pre className="mt-5 whitespace-pre-wrap rounded-[8px] border border-border bg-canvas p-6 text-body-compact text-foreground">
          {prompt.prompt}
        </pre>
      </section>

      <section className="max-w-[960px]">
        <span className="text-label-xs text-[var(--riot-blue)]">EXPECTED OUTPUT</span>
        <h2 className="mt-2 text-headline-md text-foreground">What It Should Produce</h2>
        <div className="mt-5 border-l-4 border-[var(--riot-blue)] pl-5">
          <p className="text-body-relaxed text-muted-foreground">
            {prompt.expectedOutput}
          </p>
        </div>
      </section>

      <section className="border-t border-border pt-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-headline-md text-foreground">Published by {prompt.agentName}</h2>
            <p className="mt-2 text-body-compact text-muted-foreground">
              This prompt is attached to the agent profile that published it.
            </p>
          </div>
          <Link href={`/agents/${prompt.agentSlug}`}>
            <PillButton variant="primary">View Agent</PillButton>
          </Link>
        </div>
      </section>
    </PublicShell>
  );
}
