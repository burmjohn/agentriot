import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { notFound } from "next/navigation";
import { PromptBodyCard } from "@/app/prompts/[slug]/prompt-body-card";
import {
  PublicBody,
  PublicDetailHero,
  PublicPanel,
  PublicRelatedList,
  PublicShell,
  PublicTaxonomyGroups,
} from "@/app/_components/public-ui";
import { getPublishedPromptDetail } from "@/lib/public/hub";
import { getRedirectTarget } from "@/lib/content/redirects";
import { buildPageMetadata } from "@/lib/seo/metadata";

export default async function PromptDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const record = await getPublishedPromptDetail(slug);

  if (!record) {
    const redirectRecord = await getRedirectTarget(`/prompts/${slug}`);

    if (redirectRecord?.isPermanent) {
      permanentRedirect(redirectRecord.targetPath);
    }

    notFound();
  }

  return (
    <PublicShell>
      <PublicDetailHero
        eyebrow="Prompt record"
        title={record.title}
        summary={record.shortDescription}
        meta={[
          "prompt",
          record.providerCompatibility ? record.providerCompatibility : "published",
        ]}
      />
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="grid gap-6">
          <PublicPanel
            title="Prompt body"
            detail="Copyable working text with optional provider and variable context."
          >
            <PromptBodyCard promptBody={record.promptBody} />
          </PublicPanel>
          <PublicPanel title="Context">
            <PublicBody body={record.fullDescription} />
            {record.variablesSchema ? (
              <div className="rounded-[1.25rem] border border-border/80 bg-background/85 px-4 py-4 text-sm leading-7 text-muted">
                <span className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-muted">
                  Variables
                </span>
                <p className="mt-2 whitespace-pre-wrap">{record.variablesSchema}</p>
              </div>
            ) : null}
            {record.exampleOutput ? (
              <div className="rounded-[1.25rem] border border-border/80 bg-background/85 px-4 py-4 text-sm leading-7 text-muted">
                <span className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-muted">
                  Example output
                </span>
                <p className="mt-2 whitespace-pre-wrap">{record.exampleOutput}</p>
              </div>
            ) : null}
          </PublicPanel>
          <PublicPanel title="Related content">
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
          <PublicPanel title="Related agents">
            <PublicRelatedList
              items={record.relatedAgents}
              emptyMessage="No published agents are linked yet."
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
  const record = await getPublishedPromptDetail(slug);

  if (!record) {
    return buildPageMetadata({
      title: "Prompt not found",
      path: `/prompts/${slug}`,
    });
  }

  return buildPageMetadata({
    title: record.title,
    description: record.shortDescription ?? record.fullDescription,
    path: `/prompts/${record.slug}`,
  });
}
