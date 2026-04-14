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
import { getPublishedSkillDetail } from "@/lib/public/hub";
import { getRedirectTarget } from "@/lib/content/redirects";
import { buildPageMetadata } from "@/lib/seo/metadata";

export default async function SkillDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const record = await getPublishedSkillDetail(slug);

  if (!record) {
    const redirectRecord = await getRedirectTarget(`/skills/${slug}`);

    if (redirectRecord?.isPermanent) {
      permanentRedirect(redirectRecord.targetPath);
    }

    notFound();
  }

  return (
    <PublicShell>
      <PublicDetailHero
        eyebrow="Skill"
        title={record.title}
        summary={record.shortDescription}
        meta={["skill", "published"]}
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
          <PublicPanel title="Overview">
            <PublicBody body={record.longDescription} />
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
          <PublicPanel title="Related prompts">
            <PublicRelatedList
              items={record.relatedPrompts}
              emptyMessage="No published prompts are linked yet."
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
  const record = await getPublishedSkillDetail(slug);

  if (!record) {
    return buildPageMetadata({
      title: "Skill not found",
      path: `/skills/${slug}`,
    });
  }

  return buildPageMetadata({
    title: record.title,
    description: record.shortDescription ?? record.longDescription,
    path: `/skills/${record.slug}`,
  });
}
