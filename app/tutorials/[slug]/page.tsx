import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  PublicBody,
  PublicDetailHero,
  PublicPanel,
  PublicRelatedList,
  PublicShell,
  PublicTaxonomyGroups,
} from "@/app/_components/public-ui";
import { getPublishedContentDetail } from "@/lib/public/hub";
import { buildPageMetadata } from "@/lib/seo/metadata";

export default async function TutorialDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const record = await getPublishedContentDetail("tutorial", slug);

  if (!record) {
    notFound();
  }

  return (
    <PublicShell>
      <PublicDetailHero
        eyebrow="Tutorial"
        title={record.title}
        summary={record.excerpt}
        meta={[record.subtype ?? "tutorial", "published"]}
      />
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="grid gap-6">
          <PublicPanel title="Guide body">
            <PublicBody body={record.body} />
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
  const record = await getPublishedContentDetail("tutorial", slug);

  if (!record) {
    return buildPageMetadata({
      title: "Tutorial not found",
      path: `/tutorials/${slug}`,
    });
  }

  return buildPageMetadata({
    title: record.seoTitle ?? record.title,
    description: record.seoDescription ?? record.excerpt,
    path: `/tutorials/${record.slug}`,
    canonicalUrl: record.canonicalUrl,
    imageUrl: record.heroImageUrl,
  });
}
