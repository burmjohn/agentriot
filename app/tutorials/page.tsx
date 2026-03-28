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
import { listPublishedContent, listTaxonomyTermsByScope } from "@/lib/public/hub";
import { getFilterRedirectTarget } from "@/lib/content/redirects";

export default async function TutorialsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const activeTerm = Array.isArray(params.term) ? params.term[0] : params.term;
  const [tutorials, taxonomyTerms] = await Promise.all([
    listPublishedContent("tutorial", activeTerm),
    listTaxonomyTermsByScope("content"),
  ]);

  const redirectRecord = await getFilterRedirectTarget({
    basePath: "/tutorials",
    activeTerm,
    knownSlugs: taxonomyTerms.map((term) => term.slug),
  });

  if (redirectRecord?.isPermanent) {
    permanentRedirect(redirectRecord.targetPath);
  }

  return (
    <PublicShell>
      <PublicPageHeader
        eyebrow="Tutorials"
        title="Practical guides with graph context"
        detail="Published tutorials stay tied to the prompts, skills, and agent records that make them useful instead of becoming isolated how-to posts."
      />
      <PublicFilterChips
        basePath="/tutorials"
        activeSlug={activeTerm}
        terms={taxonomyTerms}
      />
      {tutorials.length === 0 ? (
        <PublicEmptyState
          title={
            activeTerm ? "No published tutorials match this term yet" : "No published tutorials yet"
          }
          detail={
            activeTerm
              ? "Try a different scoped term or clear the filter to return to the full tutorial collection."
              : "Publish the first tutorial from admin and it will appear here with graph links into the rest of the hub."
          }
          actions={
            activeTerm ? (
              <Link
                href="/tutorials"
                className="chip rounded-full px-4 py-2 text-sm font-medium text-foreground"
              >
                Clear filter
              </Link>
            ) : undefined
          }
        />
      ) : (
        <PublicCollectionGrid
          items={tutorials.map((tutorial) => ({
            href: `/tutorials/${tutorial.slug}`,
            title: tutorial.title,
            summary: tutorial.excerpt,
            meta: [tutorial.subtype ?? "tutorial", "published"],
          }))}
        />
      )}
    </PublicShell>
  );
}

export const dynamic = "force-dynamic";
export const metadata = buildPageMetadata({
  title: "Tutorials",
  description: "Read published tutorials and guides connected to prompts, skills, and agent records.",
  path: "/tutorials",
});
