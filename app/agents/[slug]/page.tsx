import type { Metadata } from "next";
import Link from "next/link";
import { permanentRedirect } from "next/navigation";
import { notFound } from "next/navigation";
import {
  PublicBody,
  PublicDetailHero,
  PublicPanel,
  PublicRelatedList,
  PublicShell,
  PublicTaxonomyGroups,
} from "@/app/_components/public-ui";
import { getPublishedAgentDetail } from "@/lib/public/hub";
import { getRedirectTarget } from "@/lib/content/redirects";
import { buildPageMetadata } from "@/lib/seo/metadata";

export default async function AgentDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const record = await getPublishedAgentDetail(slug);

  if (!record) {
    const redirectRecord = await getRedirectTarget(`/agents/${slug}`);

    if (redirectRecord?.isPermanent) {
      permanentRedirect(redirectRecord.targetPath);
    }

    notFound();
  }

  return (
    <PublicShell>
      <PublicDetailHero
        eyebrow="Agent record"
        title={record.title}
        summary={record.shortDescription}
        meta={["agent", "published"]}
        actions={
          <>
            {record.websiteUrl ? (
              <Link
                href={record.websiteUrl}
                className="inline-flex min-h-11 items-center rounded-full bg-foreground px-4 text-sm font-medium text-background"
              >
                Website
              </Link>
            ) : null}
            {record.githubUrl ? (
              <Link
                href={record.githubUrl}
                className="chip inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium text-foreground"
              >
                GitHub
              </Link>
            ) : null}
          </>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="grid gap-6">
          <PublicPanel
            title="Overview"
            detail="Long-form context, product notes, and verified usage details."
          >
            <PublicBody body={record.longDescription} />
            {record.pricingNotes ? (
              <div className="rounded-[1.25rem] border border-border/80 bg-background/85 px-4 py-4 text-sm leading-7 text-muted">
                <span className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-muted">
                  Pricing notes
                </span>
                <p className="mt-2">{record.pricingNotes}</p>
              </div>
            ) : null}
          </PublicPanel>
          <PublicPanel
            title="Related content"
            detail="Articles and tutorials connected to this agent in the graph."
          >
            <PublicRelatedList
              items={record.relatedContent}
              emptyMessage="No published articles or tutorials are linked yet."
            />
          </PublicPanel>
        </div>
        <div className="grid gap-6">
          <PublicPanel title="Taxonomy">
            <PublicTaxonomyGroups terms={record.taxonomy} />
          </PublicPanel>
          <PublicPanel title="Related prompts">
            <PublicRelatedList
              items={record.relatedPrompts}
              emptyMessage="No published prompts are linked yet."
            />
          </PublicPanel>
          <PublicPanel title="Related skills">
            <PublicRelatedList
              items={record.relatedSkills}
              emptyMessage="No published skills are linked yet."
            />
          </PublicPanel>
        </div>
      </div>
    </PublicShell>
  );
}

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const record = await getPublishedAgentDetail(slug);

  if (!record) {
    return buildPageMetadata({
      title: "Agent not found",
      path: `/agents/${slug}`,
    });
  }

  return buildPageMetadata({
    title: record.title,
    description: record.shortDescription,
    path: `/agents/${record.slug}`,
  });
}
