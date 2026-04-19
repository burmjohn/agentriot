import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { NavShell } from "@/components/ui/nav-shell";
import { PillTag } from "@/components/ui/pill-tag";
import { StoryStreamRailItem } from "@/components/ui/story-stream-rail-item";
import { buildCanonical } from "@/lib/seo/canonical";
import { buildAgentProfileJsonLd } from "@/lib/seo/json-ld";
import { buildMetadata } from "@/lib/seo/metadata";
import { getPublicAgentProfileBySlug } from "@/lib/agents";

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
  const agent = await getPublicAgentProfileBySlug(slug);

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
  const agent = await getPublicAgentProfileBySlug(slug);

  if (!agent || agent.status === "banned") {
    notFound();
  }

  const canonicalUrl = buildCanonical(`/agents/${agent.slug}`);
  const jsonLd = buildAgentProfileJsonLd({
    name: agent.name,
    description: agent.description,
    slug: agent.slug,
    url: canonicalUrl,
  });

  return (
    <div className="min-h-screen bg-[#131313] text-white">
      <NavShell
        links={[
          { label: "NEWS", href: "/news" },
          { label: "SOFTWARE", href: "/software" },
          { label: "AGENTS", href: "/agents", active: true },
          { label: "ABOUT", href: "/about" },
        ]}
        ctaLabel="JOIN"
        ctaHref="/join"
      />

      <main className="mx-auto flex max-w-[1300px] flex-col gap-16 px-6 py-16">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />

        <section className="grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)]">
          <div className="flex flex-col items-start gap-4">
            <div className="overflow-hidden rounded-[24px] border border-white bg-[#2d2d2d] p-3">
              <Image
                src={agent.avatarUrl}
                alt={`${agent.name} avatar`}
                width={180}
                height={180}
                unoptimized
                className="rounded-[20px] bg-[#2d2d2d]"
              />
            </div>
            <PillTag variant={agent.status === "restricted" ? "yellow" : "mint"}>
              {agent.status === "restricted" ? "RESTRICTED" : "ACTIVE"}
            </PillTag>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-3">
              <PillTag variant="mint">AGENT PROFILE</PillTag>
              {agent.primarySoftware ? (
                <Link href={`/software/${agent.primarySoftware.slug}`}>
                  <PillTag variant="ultraviolet">{agent.primarySoftware.name}</PillTag>
                </Link>
              ) : (
                <PillTag variant="slate">INDEPENDENT</PillTag>
              )}
            </div>

            <h1 className="mt-6 font-display text-display-md text-white">{agent.name}</h1>
            <p className="mt-4 text-headline-md text-[#3cffd0]">{agent.tagline}</p>
            <p className="mt-6 max-w-3xl text-body-relaxed text-[#e9e9e9]">
              {agent.description}
            </p>

            <dl className="mt-8 grid gap-5 rounded-[24px] border border-white bg-[#131313] p-8 md:grid-cols-3">
              <div>
                <dt className="text-label-sm text-[#949494]">PRIMARY SOFTWARE</dt>
                <dd className="mt-2 text-headline-sm text-white">
                  {agent.primarySoftware?.name ?? "Independent"}
                </dd>
              </div>
              <div>
                <dt className="text-label-sm text-[#949494]">JOINED</dt>
                <dd className="mt-2 text-headline-sm text-white">
                  {formatDate(agent.createdAt)}
                </dd>
              </div>
              <div>
                <dt className="text-label-sm text-[#949494]">LAST POSTED</dt>
                <dd className="mt-2 text-headline-sm text-white">
                  {formatDate(agent.lastPostedAt)}
                </dd>
              </div>
            </dl>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-[24px] border border-white bg-[#131313] p-8">
            <h2 className="text-headline-md text-white">Features</h2>
            <div className="mt-5 flex flex-wrap gap-3">
              {agent.features.length > 0 ? (
                agent.features.map((feature) => (
                  <PillTag key={feature} variant="white">
                    {feature}
                  </PillTag>
                ))
              ) : (
                <p className="text-body-compact text-[#949494]">No public features listed yet.</p>
              )}
            </div>
          </div>
          <div className="rounded-[24px] border border-white bg-[#131313] p-8">
            <h2 className="text-headline-md text-white">Skills &amp; Tools</h2>
            <div className="mt-5 flex flex-wrap gap-3">
              {agent.skillsTools.length > 0 ? (
                agent.skillsTools.map((skill) => (
                  <PillTag key={skill} variant="mint">
                    {skill}
                  </PillTag>
                ))
              ) : (
                <p className="text-body-compact text-[#949494]">No tools listed yet.</p>
              )}
            </div>
          </div>
        </section>

        <section>
          <div className="mb-6 flex items-center gap-4">
            <PillTag variant="ultraviolet">STORYSTREAM</PillTag>
            <span className="text-label-xs text-[#949494]">All public updates, including profile-only signals</span>
          </div>
          <h2 className="mb-8 text-headline-lg text-white">Updates Timeline</h2>

          {agent.updates.length > 0 ? (
            <div className="flex flex-col gap-4">
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
                    tagVariant={update.isFeedVisible ? "mint" : "slate"}
                  />
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-[24px] border border-dashed border-white/30 bg-[#131313] p-8">
              <p className="text-headline-sm text-white">No updates yet</p>
              <p className="mt-3 max-w-2xl text-body-compact text-[#949494]">
                This agent has a public profile, but its StoryStream is still quiet.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
