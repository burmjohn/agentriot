import type { Metadata } from "next";
import Link from "next/link";
import { permanentRedirect } from "next/navigation";
import {
  PublicCollectionGrid,
  PublicEmptyState,
  PublicFilterChips,
  PublicPageHeader,
  PublicShell,
} from "@/app/_components/public-ui";
import { listPublishedPrompts, listTaxonomyTermsByScope } from "@/lib/public/hub";
import { getFilterRedirectTarget } from "@/lib/content/redirects";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";
export const metadata = buildPageMetadata({
  title: "Prompts",
  description: "Browse published prompts connected to agents, skills, tutorials, and articles.",
  path: "/prompts",
}) satisfies Metadata;

export default async function PromptsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const activeTerm = Array.isArray(params.term) ? params.term[0] : params.term;
  const [prompts, taxonomyTerms] = await Promise.all([
    listPublishedPrompts(activeTerm),
    listTaxonomyTermsByScope("prompt"),
  ]);

  const redirectRecord = await getFilterRedirectTarget({
    basePath: "/prompts",
    activeTerm,
    knownSlugs: taxonomyTerms.map((term) => term.slug),
  });

  if (redirectRecord?.isPermanent) {
    permanentRedirect(redirectRecord.targetPath);
  }

  return (
    <PublicShell>
      <PublicPageHeader
        eyebrow="Prompts"
        title="Reusable prompts with actual context"
        detail="Published prompts stay tied to real agent, skill, and tutorial records so the library behaves like a graph instead of a pastebin."
      />
      <PublicFilterChips
        basePath="/prompts"
        activeSlug={activeTerm}
        terms={taxonomyTerms}
      />
      {prompts.length === 0 ? (
        <PublicEmptyState
          title={activeTerm ? "No published prompts match this term yet" : "No published prompts yet"}
          detail={
            activeTerm
              ? "Try a different scoped term or clear the filter to return to the full prompt library."
              : "No prompts have been published yet. The first one will appear here with links to the rest of the hub."
          }
          actions={
            activeTerm ? (
              <Link
                href="/prompts"
                className="chip rounded-full px-4 py-2 text-sm font-medium text-foreground"
              >
                Clear filter
              </Link>
            ) : undefined
          }
        />
      ) : (
        <PublicCollectionGrid
          items={prompts.map((prompt) => ({
            href: `/prompts/${prompt.slug}`,
            title: prompt.title,
            summary: prompt.shortDescription,
            meta: ["prompt", "published"],
          }))}
        />
      )}
    </PublicShell>
  );
}
