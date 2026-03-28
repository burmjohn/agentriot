import Link from "next/link";
import { permanentRedirect } from "next/navigation";
import { buildPageMetadata } from "@/lib/seo/metadata";
import {
  PublicCollectionGrid,
  PublicEmptyState,
  PublicFilterChips,
  PublicPageHeader,
  PublicShell,
} from "@/app/_components/public-ui";
import { listPublishedSkills, listTaxonomyTermsByScope } from "@/lib/public/hub";
import { getFilterRedirectTarget } from "@/lib/content/redirects";

export default async function SkillsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const activeTerm = Array.isArray(params.term) ? params.term[0] : params.term;
  const [skills, taxonomyTerms] = await Promise.all([
    listPublishedSkills(activeTerm),
    listTaxonomyTermsByScope("skill"),
  ]);

  const redirectRecord = await getFilterRedirectTarget({
    basePath: "/skills",
    activeTerm,
    knownSlugs: taxonomyTerms.map((term) => term.slug),
  });

  if (redirectRecord?.isPermanent) {
    permanentRedirect(redirectRecord.targetPath);
  }

  return (
    <PublicShell>
      <PublicPageHeader
        eyebrow="Skills"
        title="Skills and workflows with usable context"
        detail="Published skill records turn repeatable workflows into browsable artifacts connected to prompts, agents, and supporting guides."
      />
      <PublicFilterChips
        basePath="/skills"
        activeSlug={activeTerm}
        terms={taxonomyTerms}
      />
      {skills.length === 0 ? (
        <PublicEmptyState
          title={activeTerm ? "No published skills match this term yet" : "No published skills yet"}
          detail={
            activeTerm
              ? "Try a different scoped term or clear the filter to return to the full workflow directory."
              : "Publish the first skill from admin and this collection will become a proper workflow directory."
          }
          actions={
            activeTerm ? (
              <Link
                href="/skills"
                className="chip rounded-full px-4 py-2 text-sm font-medium text-foreground"
              >
                Clear filter
              </Link>
            ) : undefined
          }
        />
      ) : (
        <PublicCollectionGrid
          items={skills.map((skill) => ({
            href: `/skills/${skill.slug}`,
            title: skill.title,
            summary: skill.shortDescription,
            meta: ["skill", "published"],
          }))}
        />
      )}
    </PublicShell>
  );
}

export const dynamic = "force-dynamic";
export const metadata = buildPageMetadata({
  title: "Skills",
  description: "Browse published skills and workflows connected to prompts, agents, tutorials, and articles.",
  path: "/skills",
});
