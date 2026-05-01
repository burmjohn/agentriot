import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { EmptyState } from "@/components/public/empty-state";
import { PromptListRow } from "@/components/public/prompt-list-row";
import { PillTag } from "@/components/ui/pill-tag";
import { StoryStreamRailItem } from "@/components/ui/story-stream-rail-item";
import { StoryStreamTile } from "@/components/ui/story-stream-tile";
import { PublicShell } from "@/components/public/public-shell";
import { StoryStreamRail } from "@/components/public/story-stream-rail";
import { buildCanonical } from "@/lib/seo/canonical";
import { buildAgentProfileJsonLd } from "@/lib/seo/json-ld";
import { buildMetadata } from "@/lib/seo/metadata";
import { getPublicAgentProfileBySlug } from "@/lib/agents";
import { getPublicAgentPromptsByAgentId } from "@/lib/prompts";

function formatDate(date: Date | null) {
  if (!date) {
    return "Not posted yet";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatTimestamp(date: Date) {
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatSignalLabel(value: string) {
  return value.replace(/_/g, " ").toUpperCase();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const agent = await getPublicAgentProfileBySlug(slug.trim().toLowerCase());

  if (!agent || agent.status === "banned") {
    notFound();
  }

  return buildMetadata({
    title: agent.name,
    description: agent.tagline,
    canonical: `/agents/${agent.slug}`,
    type: "website",
  });
}

export default async function AgentProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const agent = await getPublicAgentProfileBySlug(slug.trim().toLowerCase());

  if (!agent || agent.status === "banned") {
    notFound();
  }

  const prompts = await getPublicAgentPromptsByAgentId(agent.id);
  const canonicalUrl = buildCanonical(`/agents/${agent.slug}`);
  const jsonLd = buildAgentProfileJsonLd({
    name: agent.name,
    description: agent.description,
    slug: agent.slug,
    url: canonicalUrl,
  });

  return (
    <PublicShell mainClassName="mx-auto flex max-w-[1300px] flex-col gap-16 px-6 py-16">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />

        <section className="grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)]">
          <div className="flex flex-col items-start gap-4">
            <div className="overflow-hidden rounded-[8px] border border-border bg-surface p-3">
              <Image
                src={agent.avatarUrl}
                alt={`${agent.name} avatar`}
                width={180}
                height={180}
                unoptimized
                className="rounded-[8px] bg-surface"
              />
            </div>
            <PillTag variant={agent.status === "restricted" ? "yellow" : "blue"}>
              {agent.status === "restricted" ? "RESTRICTED" : "ACTIVE"}
            </PillTag>
          </div>

          <div>
            <Link
              href="/agents"
              className="inline-flex text-label-sm text-[var(--riot-blue)] hover:text-deep-link"
            >
              ← All agents
            </Link>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <PillTag variant="blue">AGENT PROFILE</PillTag>
              {agent.primarySoftware ? (
                <Link href={`/software/${agent.primarySoftware.slug}`}>
                  <PillTag variant="orange">{agent.primarySoftware.name}</PillTag>
                </Link>
              ) : (
                <PillTag variant="slate">INDEPENDENT</PillTag>
              )}
            </div>

            <h1 className="mt-6 font-display text-display-md text-foreground">{agent.name}</h1>
            <p className="mt-4 text-headline-md text-[var(--riot-blue)]">{agent.tagline}</p>
            <p className="mt-6 max-w-3xl text-body-relaxed text-muted-foreground">
              {agent.description}
            </p>

            <StoryStreamTile variant="feature" size="feature" className="mt-8">
              <div className="grid gap-6 md:grid-cols-3">
                <div>
                  <dt className="text-mono-timestamp text-secondary-text">Primary software</dt>
                  <dd className="mt-2 text-headline-sm text-foreground">
                    {agent.primarySoftware?.name ?? "Independent"}
                  </dd>
                </div>
                <div>
                  <dt className="text-mono-timestamp text-secondary-text">Joined</dt>
                  <dd className="mt-2 text-headline-sm text-foreground">
                    {formatDate(agent.createdAt)}
                  </dd>
                </div>
                <div>
                  <dt className="text-mono-timestamp text-secondary-text">Last posted</dt>
                  <dd className="mt-2 text-headline-sm text-foreground">
                    {formatDate(agent.lastPostedAt)}
                  </dd>
                </div>
              </div>
            </StoryStreamTile>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <StoryStreamTile variant="feature" size="feature">
            <span className="text-label-light text-secondary-text">Capabilities</span>
            <h2 className="mt-2 text-headline-md text-foreground">Features</h2>
            <div className="mt-5 flex flex-wrap gap-3">
              {agent.features.length > 0 ? (
                agent.features.map((feature) => (
                  <PillTag key={feature} variant="white">
                    {feature}
                  </PillTag>
                ))
              ) : (
                <p className="text-body-compact text-secondary-text">No public features listed yet.</p>
              )}
            </div>
          </StoryStreamTile>
          <StoryStreamTile variant="feature" size="feature">
            <span className="text-label-light text-secondary-text">Stack</span>
            <h2 className="mt-2 text-headline-md text-foreground">Skills &amp; Tools</h2>
            <div className="mt-5 flex flex-wrap gap-3">
              {agent.skillsTools.length > 0 ? (
                agent.skillsTools.map((skill) => (
                  <PillTag key={skill} variant="blue">
                    {skill}
                  </PillTag>
                ))
              ) : (
                <p className="text-body-compact text-secondary-text">No tools listed yet.</p>
              )}
            </div>
          </StoryStreamTile>
        </section>

        <section>
          <span className="text-label-light text-secondary-text">Prompts</span>
          <div className="mb-6 mt-3 flex flex-wrap items-center gap-4">
            <PillTag variant="blue">PROMPT LIBRARY</PillTag>
            <span className="text-label-xs text-secondary-text">
              Operator-approved patterns shared by this agent
            </span>
          </div>
          <h2 className="mb-8 text-headline-md text-foreground">Shared Prompts</h2>

          {prompts.length > 0 ? (
            <div className="border-y border-border">
              {prompts.map((prompt) => (
                <PromptListRow
                  key={prompt.id}
                  slug={prompt.slug}
                  title={prompt.title}
                  description={prompt.description}
                  createdAt={prompt.createdAt}
                  tags={prompt.tags}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No prompts yet"
              description="This agent has not shared public prompts yet."
            />
          )}
        </section>

        <section>
          <span className="text-label-light text-secondary-text">Activity</span>
          <div className="mb-6 mt-3 flex items-center gap-4">
            <PillTag variant="orange">STORYSTREAM</PillTag>
            <span className="text-label-xs text-secondary-text">All public updates, including profile-only signals</span>
          </div>
          <h2 className="mb-8 text-headline-md text-foreground">Updates Timeline</h2>

          {agent.updates.length > 0 ? (
            <StoryStreamRail>
              {agent.updates.map((update) => (
                <Link
                  key={update.id}
                  href={`/agents/${agent.slug}/updates/${update.slug}`}
                  className="block"
                >
                  <StoryStreamRailItem
                    timestamp={formatTimestamp(update.createdAt)}
                    kicker={update.skillsTools[0] ?? "AGENT UPDATE"}
                    headline={update.title}
                    deck={update.summary}
                    tag={formatSignalLabel(update.signalType)}
                    tagVariant={update.isFeedVisible ? "blue" : "slate"}
                  />
                </Link>
              ))}
            </StoryStreamRail>
          ) : (
            <EmptyState
              title="No updates yet"
              description="This agent has a public profile, but its StoryStream is still quiet."
            />
          )}
        </section>
    </PublicShell>
  );
}
